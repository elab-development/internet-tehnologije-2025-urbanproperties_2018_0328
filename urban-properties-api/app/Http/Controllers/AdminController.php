<?php

namespace App\Http\Controllers;

use App\Http\Resources\OfferResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\ViewingAppointmentResource;
use App\Models\Offer;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\User;
use App\Models\ViewingAppointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    private function ensureAdmin(Request $request)
    {
        if ($request->user()->role !== User::ROLE_ADMIN) {
            return response()->json([
                'success' => false,
                'message' => 'Nemate dozvolu za ovu akciju.',
                'errors' => ['authorization' => ['Samo Administrator ima pristup ovoj funkciji.']],
            ], 403);
        }
        return null;
    }

    public function users(Request $request)
    {
        if ($resp = $this->ensureAdmin($request)) return $resp;

        $agents = User::where('role', User::ROLE_SALES_AGENT)->get();
        $buyers = User::where('role', User::ROLE_BUYER)->get();

        $propertiesCountByAgent = Property::select('sales_agent_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('sales_agent_id')->pluck('cnt', 'sales_agent_id');

        $appointmentsCountByAgent = ViewingAppointment::select('sales_agent_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('sales_agent_id')->pluck('cnt', 'sales_agent_id');

        $offersCountByAgent = Offer::select('sales_agent_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('sales_agent_id')->pluck('cnt', 'sales_agent_id');

        $transactionsCountByAgent = Transaction::select('sales_agent_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('sales_agent_id')->pluck('cnt', 'sales_agent_id');

        $appointmentsCountByBuyer = ViewingAppointment::select('buyer_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('buyer_id')->pluck('cnt', 'buyer_id');

        $offersCountByBuyer = Offer::select('buyer_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('buyer_id')->pluck('cnt', 'buyer_id');

        $transactionsCountByBuyer = Transaction::select('buyer_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('buyer_id')->pluck('cnt', 'buyer_id');

        $agents->each(function ($u) use ($propertiesCountByAgent, $appointmentsCountByAgent, $offersCountByAgent, $transactionsCountByAgent) {
            $u->setAttribute('properties_count', (int) ($propertiesCountByAgent[$u->id] ?? 0));
            $u->setAttribute('viewing_appointments_count', (int) ($appointmentsCountByAgent[$u->id] ?? 0));
            $u->setAttribute('offers_count', (int) ($offersCountByAgent[$u->id] ?? 0));
            $u->setAttribute('transactions_count', (int) ($transactionsCountByAgent[$u->id] ?? 0));
        });

        $buyers->each(function ($u) use ($appointmentsCountByBuyer, $offersCountByBuyer, $transactionsCountByBuyer) {
            $u->setAttribute('viewing_appointments_count', (int) ($appointmentsCountByBuyer[$u->id] ?? 0));
            $u->setAttribute('offers_count', (int) ($offersCountByBuyer[$u->id] ?? 0));
            $u->setAttribute('transactions_count', (int) ($transactionsCountByBuyer[$u->id] ?? 0));
        });

        return response()->json([
            'success' => true,
            'message' => 'Lista kupaca i prodavaca.',
            'data' => [
                'sales_agents' => UserResource::collection($agents)->resolve(),
                'buyers' => UserResource::collection($buyers)->resolve(),
            ],
        ], 200);
    }

    public function reports(Request $request)
    {
        if ($resp = $this->ensureAdmin($request)) return $resp;

        $validated = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'sales_agent_id' => ['nullable', 'integer', 'exists:users,id'],
            'city' => ['nullable', 'string', 'max:80'],
        ]);

        $vaQuery = ViewingAppointment::with(['property', 'buyer', 'salesAgent'])
            ->whereBetween('scheduled_at', [$validated['date_from'], $validated['date_to']]);

        $offerQuery = Offer::with(['property', 'buyer', 'transaction'])
            ->whereBetween('created_at', [$validated['date_from'], $validated['date_to']]);

        if (!empty($validated['sales_agent_id'])) {
            $vaQuery->where('sales_agent_id', $validated['sales_agent_id']);
            $offerQuery->where('sales_agent_id', $validated['sales_agent_id']);
        }

        if (!empty($validated['city'])) {
            $vaQuery->whereHas('property', fn ($q) => $q->where('city', $validated['city']));
            $offerQuery->whereHas('property', fn ($q) => $q->where('city', $validated['city']));
        }

        $viewingAppointments = $vaQuery->orderByDesc('scheduled_at')->get();
        $offers = $offerQuery->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'message' => ($viewingAppointments->isEmpty() && $offers->isEmpty())
                ? 'Nema podataka za izabrani period.'
                : 'Izveštaj je uspešno generisan.',
            'data' => [
                'filters' => $validated,
                'viewing_appointments' => ViewingAppointmentResource::collection($viewingAppointments)->resolve(),
                'offers' => OfferResource::collection($offers)->resolve(),
            ],
        ], 200);
    }

    public function metrics(Request $request)
    {
        if ($resp = $this->ensureAdmin($request)) return $resp;

        $propertiesPerAgent = DB::table('properties')
            ->select('sales_agent_id', DB::raw('COUNT(*) as total'))
            ->groupBy('sales_agent_id')
            ->get();

        $appointmentsByMonth = DB::table('viewing_appointments')
            ->select(DB::raw("DATE_FORMAT(scheduled_at, '%Y-%m') as month"), DB::raw('COUNT(*) as total'))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $offersByMonth = DB::table('offers')
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('COUNT(*) as total'), DB::raw('SUM(amount) as sum_amount'))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $transactionsByMonth = DB::table('transactions')
            ->whereNotNull('signed_at')
            ->select(DB::raw("DATE_FORMAT(signed_at, '%Y-%m') as month"), DB::raw('COUNT(*) as total'), DB::raw('SUM(final_price) as sum_final_price'))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Metrike su uspešno učitane.',
            'data' => [
                'properties_per_agent' => $propertiesPerAgent,
                'viewing_appointments_by_month' => $appointmentsByMonth,
                'offers_by_month' => $offersByMonth,
                'transactions_by_month' => $transactionsByMonth,
            ],
        ], 200);
    }
}
