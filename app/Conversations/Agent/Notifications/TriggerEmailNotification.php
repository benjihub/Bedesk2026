<?php

namespace App\Conversations\Agent\Notifications;

use App\Core\UrlGenerator;
use Common\Core\Prerender\Actions\ReplacePlaceholders;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** @package App\Conversations\Agent\Notifications */
class TriggerEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public string $message;

    public function __construct(public $data)
    {
        $this->message = app(ReplacePlaceholders::class)->execute(
            $data['message'],
            $data,
        );
    }

    public function via(mixed $notifiable)
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable)
    {
        $url = app(UrlGenerator::class)->conversation(
            $this->data['conversation'],
        );

        return (new MailMessage())
            ->subject($this->data['subject'])
            ->line($this->message)
            ->action(__('View conversation'), $url);
    }
}
