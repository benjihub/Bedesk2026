// Enable bankProof feature
app('Common\Settings\Settings')->save([
    'bankProof' => [
        'enabled' => true,
        'endpoint' => '',
        'authHeader' => '',
        'minConfidence' => 0.6,
    ]
]);

echo "bankProof feature enabled!\n";
echo "Settings: " . json_encode(settings('bankProof')) . "\n";