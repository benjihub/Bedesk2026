import {ButtonProps} from '@ui/buttons/button';
import {useTrans} from '@ui/i18n/use-trans';
import {usePlayerActions} from '@common/player/hooks/use-player-actions';
import {usePlayerStore} from '@common/player/hooks/use-player-store';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Tooltip} from '@ui/tooltip/tooltip';
import {Trans} from '@ui/i18n/trans';
import {MediaFullscreenExitIcon} from '@ui/icons/media/media-fullscreen-exit';
import {MediaFullscreenIcon} from '@ui/icons/media/media-fullscreen';

interface Props {
  color?: ButtonProps['color'];
  size?: ButtonProps['size'];
  iconSize?: ButtonProps['size'];
  className?: string;
}
export function FullscreenButton({
  size = 'md',
  iconSize,
  color,
  className,
}: Props) {
  const {trans} = useTrans();
  const player = usePlayerActions();
  const playerReady = usePlayerStore(s => s.providerReady);
  const isFullscreen = usePlayerStore(s => s.isFullscreen);
  const canFullscreen = usePlayerStore(s => s.canFullscreen);

  if (!canFullscreen) {
    return null;
  }

  const labelMessage = trans(
    isFullscreen
      ? message('Exit fullscreen (f)')
      : message('Enter fullscreen (f)'),
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
          if (isFullscreen) {
            player.exitFullscreen();
          } else {
            player.enterFullscreen();
          }
        }}
      >
        {isFullscreen ? <MediaFullscreenExitIcon /> : <MediaFullscreenIcon />}
      </IconButton>
    </Tooltip>
  );
}
