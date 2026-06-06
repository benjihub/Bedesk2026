<?php namespace App\Webhooks\Controllers;

use App\Conversations\Email\CreateTicketForFailedOutgoingEmail;
use App\Conversations\Email\Parsing\ParsedEmail;
use App\Conversations\Email\TransformEmailIntoTicketOrReply;
use App\Conversations\Email\Transformers\MimeMailTransformer;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;

class EmailApiWebhookController extends BaseController
{
    public function handleIncoming()
    {
        $this->blockOnDemoSite();

        // handle legacy mailgun webhook
        if (request()->has('stripped-html')) {
            return app(MailgunWebhookController::class)->handleIncoming();
        }

        if (!settings('incoming_email.api.enabled')) {
            return $this->error('Incoming email API is not enabled.');
        }

        if (!Auth::user()?->hasPermission('tickets.update')) {
            return response(
                "You don't have permissions to create tickets.",
                406,
            );
        }

        if (request('mime')) {
            $emailData = (new MimeMailTransformer())->transform(
                request('mime'),
            );
        } else {
            $emailData = request()->only(['headers', 'body', 'attachments']);
            if (isset($emailData['attachments'])) {
                $emailData['attachments'] = array_map(function ($attachment) {
                    $attachment['contents'] = base64_decode(
                        $attachment['contents'],
                    );
                    return $attachment;
                }, $emailData['attachments']);
            }
        }

        (new TransformEmailIntoTicketOrReply(
            new ParsedEmail($emailData),
        ))->execute();

        return $this->success();
    }

    public function handleFailed()
    {
        $this->blockOnDemoSite();

        if (!settings('incoming_email.api.enabled')) {
            return $this->success();
        }

        if (!Auth::user()?->hasPermission('tickets.update')) {
            return response(
                "You don't have permissions to create tickets.",
                406,
            );
        }

        (new CreateTicketForFailedOutgoingEmail())->execute(request()->all());

        return $this->success();
    }
}
