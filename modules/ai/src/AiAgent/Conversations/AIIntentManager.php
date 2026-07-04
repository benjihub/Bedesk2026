<?php

namespace Ai\AiAgent\Conversations;

use App\Conversations\Models\Conversation;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class AIIntentManager
{
    public function __construct(protected Conversation $conversation) {}

    public function detectIntent(string $text): string
    {
        $t = mb_strtolower((string) $text);

        $mentionsPromo = (bool) preg_match('/\b(promo|promosi|bonus|event|voucher|kode|code)\b/u', $t);
        $mentionClaimCore = (bool) preg_match('/\b(klaim|claim)\b/u', $t);
        $mentionClaimPhrases = (bool) preg_match('/\b(cara\s+(klaim|claim|redeem|tebus)|how\s+to\s+claim|claim\s+promo|claim\s+code|kode\s+promo)\b/u', $t);
        $actionWithPromo = (bool) preg_match('/\b(ambil|ikut|join|daftar|redeem|tebus)\b/u', $t) && $mentionsPromo;
        if ($mentionsPromo && ($mentionClaimCore || $mentionClaimPhrases || $actionWithPromo)) {
            return 'userid_collection';
        }

        if (
            preg_match('/\b(deposit|depo|deponya|dp|top\s?up|topup|isi saldo)\b/u', $t) ||
            preg_match('/\b(withdraw|wd|tarik|penarikan|cair|withdrawal)\b/u', $t) ||
            preg_match('/\b(turnover|rollover|omset|perputaran|kelipatan|wager|wr)\b/u', $t) ||
            preg_match('/\b(lupa password|reset password|ganti sandi|lupa pass|reset pass|ga bisa login|gk bisa login)\b/u', $t)
        ) {
            return 'userid_collection';
        }

        if (preg_match('/\b(daftar|register|buat akun|signup|registrasi)\b/u', $t)) return 'register';
        if (preg_match('/\b(promo|promosi|bonus|event)\b/u', $t)) return 'promotion';
        if (preg_match('/\brtp\b/u', $t)) return 'rtp';
        if (preg_match('/\b(game|games|slot|slots|gacor|permainan|daftar game|game apa|slot apa)\b/u', $t)) return 'games';
        return 'general';
    }

    public function isFrustrationMessage(string $text): bool
    {
        $lower = mb_strtolower($text);
        if ($lower === '') return false;

        $hasProfanity = (bool) preg_match('/\b(anjing|kontol|tolol|bangsat|babi|goblok|memek|kampret|sampah|busuk|jelek)\b/u', $lower);
        $hasComplaint = (bool) preg_match('/\b(kalah|rugi|ga\s*dapet|gak\s*dapet|nggak\s*dapet|tidak\s*dapat|gak\s*masuk|tidak\s*masuk|nyangkut|error|susah|kecewa|marah|emosi|situs\s*busuk|parah)\b/u', $lower);
        $hasDepositCountComplaint = (bool) preg_match('/\b((\d+)\s*x\s*deposit|deposit\s*(\d+)\s*x|\d+\s*x\s*depo|\d+\s*x\s*deponya|udah\s*deposit|sudah\s*deposit|udah\s*deponya|sudah\s*deponya)\b/u', $lower);
        $hasStrongPunct = (bool) preg_match('/[!?.]{2,}/u', $text);

        return $hasProfanity || $hasComplaint || $hasDepositCountComplaint || $hasStrongPunct;
    }

    public function tokenizeWords(string $text): array
    {
        $lower = mb_strtolower($text);
        $parts = preg_split('/[^a-z0-9_]+/iu', $lower) ?: [];
        return array_values(array_filter($parts, fn($w) => is_string($w) && trim($w) !== ''));
    }

    public function containsApprox(array $tokens, array $keywords, int $maxDistance = 1): bool
    {
        foreach ($tokens as $t) {
            $t = is_string($t) ? trim($t) : '';
            if ($t === '') continue;
            foreach ($keywords as $kw) {
                $kw = is_string($kw) ? mb_strtolower(trim($kw)) : '';
                if ($kw === '') continue;
                if ($t === $kw) return true;
                if (function_exists('levenshtein')) {
                    $d = levenshtein($t, $kw);
                    if ($d <= $maxDistance) return true;
                }
            }
        }
        return false;
    }
}
