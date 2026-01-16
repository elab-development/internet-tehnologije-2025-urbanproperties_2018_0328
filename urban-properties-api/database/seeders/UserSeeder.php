<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1 admin sa poznatim kredencijalima.
        User::factory()->administrator()->create([
            'name' => 'Urban Admin',
            'email' => 'admin@urban.test',
            'password' => 'password',
            'phone' => '+38160111222',
        ]);

        // 3 sales agent-a (čitljivo, sa fiksnim email-ovima).
        User::factory()->salesAgent()->create([
            'name' => 'Ana Agent',
            'email' => 'ana.agent@urban.test',
            'password' => 'password',
            'phone' => '+38160111001',
        ]);

        User::factory()->salesAgent()->create([
            'name' => 'Marko Agent',
            'email' => 'marko.agent@urban.test',
            'password' => 'password',
            'phone' => '+38160111002',
        ]);

        User::factory()->salesAgent()->create([
            'name' => 'Jelena Agent',
            'email' => 'jelena.agent@urban.test',
            'password' => 'password',
            'phone' => '+38160111003',
        ]);

        // 8 buyer-a.
        User::factory()->count(8)->buyer()->create();
    }
}
