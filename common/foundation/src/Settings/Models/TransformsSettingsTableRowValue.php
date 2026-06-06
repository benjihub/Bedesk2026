<?php

namespace Common\Settings\Models;

use Common\Settings\Settings;
use Exception;

trait TransformsSettingsTableRowValue
{
    protected function decodeDbValue(
        string $name,
        $value,
        $forceJsonArray = true,
    ) {
        if (in_array($name, Settings::$secretKeys)) {
            try {
                $value = decrypt($value);
            } catch (Exception $e) {
                $value = '';
            }
        }

        if (in_array($name, Settings::$jsonKeys)) {
            $value = json_decode($value, $forceJsonArray);
        }

        if ($value === 'false') {
            return false;
        }

        if ($value === 'true') {
            return true;
        }

        if ($value === 'null' || $value === null) {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        if (ctype_digit($value)) {
            return (int) $value;
        }

        return $value;
    }

    protected function encodeValueForDb(string $name, $value)
    {
        $value = !is_null($value) ? $value : '';

        if (in_array($name, Settings::$jsonKeys) && !is_string($value)) {
            $value = json_encode($value);
        }

        if ($value === true) {
            $value = 'true';
        } elseif ($value === false) {
            $value = 'false';
        }

        $value = (string) $value;

        if (in_array($name, Settings::$secretKeys)) {
            $value = encrypt($value);
        }

        return $value;
    }
}
