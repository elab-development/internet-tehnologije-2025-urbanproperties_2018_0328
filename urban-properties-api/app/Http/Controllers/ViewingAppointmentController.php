<?php

namespace App\Http\Controllers;

use App\Http\Resources\OfferResource;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\ViewingAppointmentResource;
use App\Models\Offer;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\User;
use App\Models\ViewingAppointment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ViewingAppointmentController extends Controller
{
    private function ensureBuyer(Request $request)
    {
        if ($request->user()->role !== User::ROLE_BUYER) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => ['authorization' => ['Samo Kupac (buyer) može da izvrši ovu akciju.']],
            ], 403);
        }
        return null;
    }

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

    public function store(Request $request)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        $validated = $request->validate([
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $property = Property::findOrFail($validated['property_id']);

        if ($property->status === Property::STATUS_SOLD) {
            return response()->json([
                'success' => false,
                'message' => 'Nekretnina nije dostupna.',
                'errors' => ['property' => ['Nekretnina je već prodata.']],
            ], 422);
        }

        $alreadyBooked = ViewingAppointment::where('property_id', $property->id)
            ->where('scheduled_at', $validated['scheduled_at'])
            ->exists();

        if ($alreadyBooked) {
            return response()->json([
                'success' => false,
                'message' => 'Termin nije dostupan.',
                'errors' => ['scheduled_at' => ['Nekretnina je zauzeta u izabranom terminu.']],
            ], 422);
        }

        $va = ViewingAppointment::create([
            'property_id' => $property->id,
            'buyer_id' => $request->user()->id,
            'sales_agent_id' => $property->sales_agent_id,
            'scheduled_at' => $validated['scheduled_at'],
            'status' => ViewingAppointment::STATUS_SCHEDULED,
            'notes' => $validated['notes'] ?? null,
        ]);

        $va->load(['property', 'buyer', 'salesAgent']);

        return response()->json([
            'success' => true,
            'message' => 'Termin gledanja je uspešno zakazan.',
            'data' => (new ViewingAppointmentResource($va))->resolve(),
        ], 201);
    }

    public function updateStatus(Request $request, ViewingAppointment $viewingAppointment)
    {
        if ($resp = $this->ensureSalesAgent($request)) return $resp;

        if ((int) $viewingAppointment->sales_agent_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => ['authorization' => ['Možete menjati status samo termina na svojim nekretninama.']],
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                ViewingAppointment::STATUS_SCHEDULED,
                ViewingAppointment::STATUS_COMPLETED,
                ViewingAppointment::STATUS_CANCELLED,
            ])],
        ]);

        $current = $viewingAppointment->status;
        $next = $validated['status'];

        $allowed = [
            ViewingAppointment::STATUS_SCHEDULED => [ViewingAppointment::STATUS_COMPLETED, ViewingAppointment::STATUS_CANCELLED],
            ViewingAppointment::STATUS_COMPLETED => [],
            ViewingAppointment::STATUS_CANCELLED => [],
        ];

        if (!in_array($next, $allowed[$current] ?? [], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Tražena promena statusa nije dozvoljena.',
                'errors' => ['status' => ["Prelazak sa '{$current}' na '{$next}' nije dozvoljen."]],
            ], 422);
        }

        $viewingAppointment->update(['status' => $next]);
        $viewingAppointment->load(['property', 'buyer', 'salesAgent']);

        return response()->json([
            'success' => true,
            'message' => 'Status termina gledanja je uspešno ažuriran.',
            'data' => (new ViewingAppointmentResource($viewingAppointment->fresh()))->resolve(),
        ], 200);
    }

    public function cancel(Request $request, ViewingAppointment $viewingAppointment)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        if ((int) $viewingAppointment->buyer_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => ['authorization' => ['Možete otkazati samo svoje termine.']],
            ], 403);
        }

        if ($viewingAppointment->status !== ViewingAppointment::STATUS_SCHEDULED) {
            return response()->json([
                'success' => false,
                'message' => 'Termin nije moguće otkazati.',
                'errors' => ['status' => ['Termin je već zaključen ili otkazan.']],
            ], 422);
        }

        if ($viewingAppointment->scheduled_at->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Termin nije moguće otkazati.',
                'errors' => ['scheduled_at' => ['Termin je već istekao.']],
            ], 422);
        }

        $viewingAppointment->update(['status' => ViewingAppointment::STATUS_CANCELLED]);
        $viewingAppointment->load(['property', 'buyer', 'salesAgent']);

        return response()->json([
            'success' => true,
            'message' => 'Termin gledanja je uspešno otkazan.',
            'data' => (new ViewingAppointmentResource($viewingAppointment->fresh()))->resolve(),
        ], 200);
    }

    public function forMyProperties(Request $request)
    {
        if ($resp = $this->ensureSalesAgent($request)) return $resp;

        $appointments = ViewingAppointment::with(['property', 'buyer'])
            ->where('sales_agent_id', $request->user()->id)
            ->orderByDesc('scheduled_at')
            ->paginate(12);

        return response()->json([
            'success' => true,
            'message' => 'Termini gledanja za vaše nekretnine.',
            'data' => [
                'items' => ViewingAppointmentResource::collection($appointments->getCollection())->resolve(),
                'pagination' => [
                    'current_page' => $appointments->currentPage(),
                    'per_page' => $appointments->perPage(),
                    'total' => $appointments->total(),
                    'last_page' => $appointments->lastPage(),
                ],
            ],
        ], 200);
    }

    public function myActivities(Request $request)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        $buyerId = $request->user()->id;

        $appointments = ViewingAppointment::with('property')
            ->where('buyer_id', $buyerId)
            ->orderByDesc('scheduled_at')
            ->get();

        $offers = Offer::with('property')
            ->where('buyer_id', $buyerId)
            ->orderByDesc('created_at')
            ->get();

        $transactions = Transaction::where('buyer_id', $buyerId)
            ->orderByDesc('signed_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Moje aktivnosti.',
            'data' => [
                'viewing_appointments' => ViewingAppointmentResource::collection($appointments)->resolve(),
                'offers' => OfferResource::collection($offers)->resolve(),
                'transactions' => TransactionResource::collection($transactions)->resolve(),
            ],
        ], 200);
    }
}
