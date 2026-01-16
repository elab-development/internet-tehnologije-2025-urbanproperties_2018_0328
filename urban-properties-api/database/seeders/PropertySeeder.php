<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;

class PropertySeeder extends Seeder
{
    public function run(): void
    {
        $agents = User::where('role', User::ROLE_SALES_AGENT)->get();

        foreach ($agents as $agent) {
            // 4 available + 1 reserved + 1 sold po agentu.
            Property::factory()->count(4)->available()->for($agent, 'salesAgent')->create();
            Property::factory()->count(1)->reserved()->for($agent, 'salesAgent')->create();
            Property::factory()->count(1)->sold()->for($agent, 'salesAgent')->create();
        }
    }
}
