<?php

namespace App\Http\Controllers;

use App\Http\Resources\OfferResource;
use App\Models\Offer;
use App\Models\Property;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class OfferController extends Controller
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
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $property = Property::findOrFail($validated['property_id']);

        if ($property->status === Property::STATUS_SOLD) {
            return response()->json([
                'success' => false,
                'message' => 'Nekretnina nije dostupna.',
                'errors' => ['property' => ['Nekretnina je već prodata.']],
            ], 422);
        }

        $offer = DB::transaction(function () use ($request, $validated, $property) {

            // 1) Kreiraj ponudu. (sales_agent_id ne postoji u Offer modelu.)
            $offer = Offer::create([
                'property_id' => $property->id,
                'buyer_id' => $request->user()->id,
                'amount' => $validated['amount'],
                'status' => Offer::STATUS_PENDING,
                // transaction_id se mora popuniti posle, ali baza ga ne prima kao NULL.
                // Ako ti baza ne dozvoljava privremenu vrednost, moraće se migracija da se ispravi.
                'transaction_id' => null,
            ]);

            // 2) Kreiraj placeholder transakciju.
            $tx = Transaction::create([
                'offer_id' => $offer->id,
                'buyer_id' => $offer->buyer_id,
                'sales_agent_id' => $property->sales_agent_id,
                'final_price' => $offer->amount,
                'signed_at' => null,
                'payment_status' => Transaction::PAYMENT_PENDING,
            ]);

            // 3) Vrati transaction_id nazad u ponudu.
            $offer->update(['transaction_id' => $tx->id]);

            return $offer;
        });

        $offer->load(['property', 'buyer', 'transaction']);

        return response()->json([
            'success' => true,
            'message' => 'Ponuda je uspešno poslata.',
            'data' => (new OfferResource($offer))->resolve(),
        ], 201);
    }

    public function mine(Request $request)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        $offers = Offer::with('property')
            ->where('buyer_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(12);

        return response()->json([
            'success' => true,
            'message' => 'Moje ponude.',
            'data' => [
                'items' => OfferResource::collection($offers->getCollection())->resolve(),
                'pagination' => [
                    'current_page' => $offers->currentPage(),
                    'per_page' => $offers->perPage(),
                    'total' => $offers->total(),
                    'last_page' => $offers->lastPage(),
                ],
            ],
        ], 200);
    }

    public function forMyProperties(Request $request)
    {
        if ($resp = $this->ensureSalesAgent($request)) return $resp;

        $offers = Offer::with(['property', 'buyer', 'transaction'])
            ->whereHas('property', function ($q) use ($request) {
                $q->where('sales_agent_id', $request->user()->id);
            })
            ->orderByDesc('created_at')
            ->paginate(12);

        return response()->json([
            'success' => true,
            'message' => 'Ponude za vaše nekretnine.',
            'data' => [
                'items' => OfferResource::collection($offers->getCollection())->resolve(),
                'pagination' => [
                    'current_page' => $offers->currentPage(),
                    'per_page' => $offers->perPage(),
                    'total' => $offers->total(),
                    'last_page' => $offers->lastPage(),
                ],
            ],
        ], 200);
    }

    public function withdraw(Request $request, Offer $offer)
    {
        if ($resp = $this->ensureBuyer($request)) return $resp;

        if ((int) $offer->buyer_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => ['authorization' => ['Možete povući samo svoje ponude.']],
            ], 403);
        }

        if ($offer->status !== Offer::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'Ponuda se ne može povući.',
                'errors' => ['status' => ['Samo ponuda u statusu pending može da se povuče.']],
            ], 422);
        }

        $offer->update(['status' => Offer::STATUS_WITHDRAWN]);
        $offer->load(['property', 'buyer', 'transaction']);

        return response()->json([
            'success' => true,
            'message' => 'Ponuda je uspešno povučena.',
            'data' => (new OfferResource($offer->fresh()))->resolve(),
        ], 200);
    }
}
