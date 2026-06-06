import {ButtonProps} from '@ui/buttons/button';
import {useTrans} from '@ui/i18n/use-trans';
import {usePlayerActions} from '@common/player/hooks/use-player-actions';
import {usePlayerStore} from '@common/player/hooks/use-player-store';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Tooltip} from '@ui/tooltip/tooltip';
import {Trans} from '@ui/i18n/trans';
import {MediaClosedCaptionsIcon} from '@ui/icons/media/media-closed-captions';
import {MediaClosedCaptionsOnIcon} from '@ui/icons/media/media-closed-captions-on';

interface Props {
  color?: ButtonProps['color'];
  size?: ButtonProps['size'];
  iconSize?: ButtonProps['size'];
  className?: string;
}
export function ToggleCaptionsButton({
  size = 'md',
  iconSize,
  color,
  className,
}: Props) {
  const {trans} = useTrans();
  const player = usePlayerActions();
  const playerReady = usePlayerStore(s => s.providerReady);
  const captionsVisible = usePlayerStore(s => s.textTrackIsVisible);
  const haveCaptions = usePlayerStore(s => !!s.textTracks.length);

  if (!haveCaptions) {
    return null;
  }

  const labelMessage = trans(
    captionsVisible
      ? message('Hide subtitles/captions (c)')
      : message('Show subtitles/captions (c)'),
  );

  return (
    <Tooltip label={<Trans message={labelMessage} />} usePortal={false}>
      <IconButton
        disabled={!playerReady}
        aria-label={labelMessage}
        size={size}
        color={color}
        iconSize={iconSize}
        className={className}
        onClick={() => {
          player.setTextTrackVisibility(!captionsVisible);
        }}
      >
        {captionsVisible ? (
          <MediaClosedCaptionsOnIcon />
        ) : (
          <MediaClosedCaptionsIcon />
        )}
      </IconButton>
    </Tooltip>
  );
}
