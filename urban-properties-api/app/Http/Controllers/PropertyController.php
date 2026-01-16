<?php

namespace App\Http\Controllers;

use App\Http\Resources\PropertyResource;
use App\Models\Offer;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\User;
use App\Models\ViewingAppointment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PropertyController extends Controller
{
    private function ensureSalesAgent(Request $request)
    {
        if ($request->user()->role !== User::ROLE_SALES_AGENT) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => ['authorization' => ['Samo Prodavac (sales_agent) može da izvrši ovu akciju.']],
            ], 403);
        }
        return null;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user && $user->role === User::ROLE_ADMIN;
        $isAgent = $user && $user->role === User::ROLE_SALES_AGENT;

        $query = Property::query()->with('salesAgent');

        if (!$isAdmin && !$isAgent) {
            $query->where('status', Property::STATUS_AVAILABLE);
        }

        if ($request->filled('city')) $query->where('city', $request->string('city'));
        if ($request->filled('type')) $query->where('type', $request->string('type'));
        if ($request->filled('min_price')) $query->where('price', '>=', (float) $request->input('min_price'));
        if ($request->filled('max_price')) $query->where('price', '<=', (float) $request->input('max_price'));
        if ($request->filled('bedrooms')) $query->where('bedrooms', (int) $request->input('bedrooms'));

        if ($request->filled('status') && ($isAdmin || $isAgent)) {
            $query->where('status', $request->string('status'));
        }

        if ($isAgent && $request->boolean('mine')) {
            $query->where('sales_agent_id', $user->id);
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        if (!in_array($sortBy, ['price', 'area_m2', 'created_at'], true)) $sortBy = 'created_at';

        $properties = $query->orderBy($sortBy, $sortDir)->paginate(12);

        return response()->json([
            'success' => true,
            'message' => 'Lista nekretnina.',
            'data' => [
                'items' => PropertyResource::collection($properties->getCollection())->resolve(),
                'pagination' => [
                    'current_page' => $properties->currentPage(),
                    'per_page' => $properties->perPage(),
                    'total' => $properties->total(),
                    'last_page' => $properties->lastPage(),
                ],
            ],
        ], 200);
    }

    public function show(Request $request, Property $property)
    {
        $user = $request->user();
        $isAdmin = $user && $user->role === User::ROLE_ADMIN;
        $isAgentOwner = $user && $user->role === User::ROLE_SALES_AGENT && (int) $property->sales_agent_id === (int) $user->id;

        if (!$isAdmin && !$isAgentOwner && $property->status !== Property::STATUS_AVAILABLE) {
            return response()->json([
                'success' => false,
                'message' => 'Nekretnina nije dostupna.',
                'errors' => ['property' => ['Nekretnina nije dostupna za prikaz.']],
            ], 404);
        }

        $property->load('salesAgent');

        return response()->json([
            'success' => true,
            'message' => 'Detalji nekretnine.',
            'data' => (new PropertyResource($property))->resolve(),
        ], 200);
    }

    public function store(Request $request)
    {
        if ($resp = $this->ensureSalesAgent($request)) return $resp;

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', 'string', 'max:50'],
            'address' => ['required', 'string', 'max:150'],
            'city' => ['required', 'string', 'max:80'],
            'area_m2' => ['nullable', 'numeric', 'min:0'],
            'bedrooms' => ['required', 'integer', 'min:0', 'max:20'],
            'bathrooms' => ['required', 'integer', 'min:0', 'max:20'],
            'price' => ['required', 'numeric', 'min:0'],
            '3d_image_url' => ['nullable', 'url', 'max:255'],
            'status' => ['nullable', Rule::in([Property::STATUS_AVAILABLE, Property::STATUS_RESERVED, Property::STATUS_SOLD])],
        ]);

        $property = Property::create([
            'sales_agent_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'area_m2' => $validated['area_m2'] ?? null,
            'bedrooms' => $validated['bedrooms'],
            'bathrooms' => $validated['bathrooms'],
            'price' => $validated['price'],
            '3d_image_url' => $validated['3d_image_url'] ?? null,
            'status' => $validated['status'] ?? Property::STATUS_AVAILABLE,
        ]);

        $property->load('salesAgent');

        return response()->json([
            'success' => true,
            'message' => 'Nekretnina je uspešno dodata.',
            'data' => (new PropertyResource($property))->resolve(),
        ], 201);
    }

    public function update(Request $request, Property $property)
    {
        if ($resp = $this->ensureSalesAgent($request)) return $resp;

        if ((int) $property->sales_agent_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => ['authorization' => ['Ne možete menjati nekretnine drugih agenata.']],
            ], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'min:2', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'type' => ['sometimes', 'string', 'max:50'],
            'address' => ['sometimes', 'string', 'max:150'],
            'city' => ['sometimes', 'string', 'max:80'],
            'area_m2' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'bedrooms' => ['sometimes', 'integer', 'min:0', 'max:20'],
            'bathrooms' => ['sometimes', 'integer', 'min:0', 'max:20'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            '3d_image_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'status' => ['sometimes', Rule::in([Property::STATUS_AVAILABLE, Property::STATUS_RESERVED, Property::STATUS_SOLD])],
        ]);

        $property->update($validated);
        $property->load('salesAgent');

        return response()->json([
            'success' => true,
            'message' => 'Nekretnina je uspešno ažurirana.',
            'data' => (new PropertyResource($property->fresh()))->resolve(),
        ], 200);
    }

    public function destroy(Request $request, Property $property)
    {
        if ($resp = $this->ensureSalesAgent($request)) return $resp;

        if ((int) $property->sales_agent_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => ['authorization' => ['Ne možete brisati nekretnine drugih agenata.']],
            ], 403);
        }

        $hasActiveAppointments = ViewingAppointment::where('property_id', $property->id)
            ->where('status', ViewingAppointment::STATUS_SCHEDULED)
            ->exists();

        $hasActiveOffers = Offer::where('property_id', $property->id)
            ->whereIn('status', [Offer::STATUS_PENDING, Offer::STATUS_ACCEPTED])
            ->exists();

        $hasTransactions = Transaction::where('property_id', $property->id)->exists();

        if ($hasActiveAppointments || $hasActiveOffers || $hasTransactions) {
            return response()->json([
                'success' => false,
                'message' => 'Nekretnina se ne može obrisati.',
                'errors' => ['property' => ['Nekretnina ima povezane aktivnosti (termini, ponude ili transakcije).']],
            ], 409);
        }

        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'Nekretnina je uspešno obrisana.',
            'data' => null,
        ], 200);
    }
}
