<?php

namespace Common\Database\Metrics;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterval;
use Carbon\CarbonPeriod;
use Carbon\Exceptions\InvalidTimeZoneException;
use Exception;

class MetricDateRange
{
    const YEAR = 'year';
    const MONTH = 'month';
    const WEEK = 'week';
    const DAY = 'day';
    const HOUR = 'hour';
    const MINUTE = 'minute';

    public CarbonImmutable $start;
    public CarbonImmutable $end;
    public string $timezone;
    public string $granularity;
    public CarbonPeriod $period;

    public function __construct(
        string|null $start = null,
        string|null $end = null,
        string|null $timezone = null,
        string|null $granularity = null,
    ) {
        $this->timezone = $timezone ?: config('app.timezone');

        $this->start = $this->parseTimestamp(
            $start,
            $this->timezone,
            CarbonImmutable::today()->startOfWeek(),
        );

        $this->end = $this->parseTimestamp(
            $end,
            $this->timezone,
            CarbonImmutable::today()->endOfWeek(),
        );

        $this->setGranularity($granularity);

        $this->period = CarbonPeriod::create($this->start, $this->end);
        $this->period->setDateInterval(
            CarbonInterval::make(1, $this->granularity),
        );
    }

    protected function parseTimestamp(
        string|null $timestamp = null,
        string $timezone,
        CarbonImmutable $fallback,
    ): CarbonImmutable {
        if (!$timestamp) {
            return $fallback;
        }

        try {
            return CarbonImmutable::parse($timestamp)->timezone($timezone);
        } catch (InvalidTimeZoneException $e) {
            return $this->parseTimestamp($timestamp, 'UTC', $fallback);
        } catch (Exception $e) {
            return $fallback;
        }
    }

    public function getPreviousPeriod(): self
    {
        return new self(
            $this->start->sub($this->start->diffAsCarbonInterval($this->end)),
            $this->start->addSecond(),
            $this->timezone,
            $this->granularity,
        );
    }

    public function getCacheKey(): string
    {
        return sprintf(
            '%s-%s-%s',
            $this->start->timestamp,
            $this->end->timestamp,
            $this->timezone,
        );
    }

    protected function setGranularity(string $granularity = null): void
    {
        // set unit specified by user
        if ($granularity) {
            $this->granularity = $granularity;
            // set the smallest supported unit based on start and end date
        } else {
            if ($this->start->diffInYears($this->end) >= 3) {
                $this->granularity = self::YEAR;
            } elseif ($this->start->diffInMonths($this->end) >= 4) {
                $this->granularity = self::MONTH;
            } elseif ($this->start->diffInDays($this->end) > 14) {
                $this->granularity = self::WEEK;
            } elseif ($this->start->diffInDays($this->end) > 1) {
                $this->granularity = self::DAY;
            } elseif ($this->start->diffInHours($this->end) > 1) {
                $this->granularity = self::HOUR;
            } else {
                $this->granularity = self::MINUTE;
            }
        }
    }

    /**
     * Return format by which metric values should be grouped based on granularity.
     */
    public function getGroupingFormat(): string
    {
        return match ($this->granularity) {
            $this::YEAR => 'Y',
            $this::MONTH => 'Y-m',
            $this::WEEK => 'o-W',
            $this::DAY => 'Y-m-d',
            $this::HOUR => 'Y-m-d H:00',
            $this::MINUTE => 'Y-m-d H:i:00',
        };
    }
}
