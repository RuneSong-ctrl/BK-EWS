<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'ai' => [
        'api_key' => env('AI_API_KEY') ?? env('GEMINI_API_KEY'),
        'endpoint' => env('AI_ENDPOINT') ?? env('GEMINI_ENDPOINT'),
        'model' => env('AI_MODEL') ?? env('GEMINI_MODEL', 'gemini-2.5-flash'),
        'provider' => env('AI_PROVIDER', 'auto'),
    ],

    // Integrasi modul ML EWS 2-Tier (folder EWS_Moodle)
    'ews' => [
        'token' => env('EWS_API_TOKEN', ''),
        'python' => env('EWS_PYTHON', 'python'),
        'pipeline' => env('EWS_PIPELINE_PATH', base_path('../EWS_Moodle/run_pipeline.py')),
        'input' => env('EWS_INPUT_PATH', base_path('../EWS_Moodle/simulasi/kelas_stikmas_hari60.csv')),
        'output' => env('EWS_OUTPUT_PATH', base_path('../EWS_Moodle/sample_output.json')),
        'course_mapping' => env('EWS_COURSE_MAPPING_PATH', base_path('../EWS_Moodle/course_mapping.csv')),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY') ?? env('AI_API_KEY'),
        'endpoint' => env('GEMINI_ENDPOINT') ?? env('AI_ENDPOINT'),
        'model' => env('GEMINI_MODEL') ?? env('AI_MODEL', 'gemini-2.5-flash'),
        'provider' => env('AI_PROVIDER', 'auto'),
    ],

];
