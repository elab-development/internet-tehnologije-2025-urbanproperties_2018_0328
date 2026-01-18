<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    // Osnovni kontroler za sve ostale kontrolere u aplikaciji.
    use AuthorizesRequests, ValidatesRequests;
}
