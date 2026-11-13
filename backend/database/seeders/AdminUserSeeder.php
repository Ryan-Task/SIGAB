<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin123@gmail.com'],
            [
                'name' => 'Administrator SIGAB',
                'password' => Hash::make('admin123'),
                'is_admin' => true,
                'two_factor_enabled' => false,
                'email_verified_at' => now(),
            ],
        );
    }
}
