<?php
try {
    $db = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
    $db->exec('CREATE DATABASE IF NOT EXISTS laravel_react_exam');
    echo "Database created successfully\n";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
