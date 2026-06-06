import {AnimatedChatMessage} from '@app/dashboard/conversations/conversation-page/messages/animated-chat-message';
import {CardsMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {useHandleButtonAction} from '@livechat/widget/conversation-screen/feed/use-handle-button-action';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import clsx from 'clsx';
import {ReactNode, useEffect, useRef, useState} from 'react';

type CarouselItem = CardsMessage['body']['items'][number];

interface Props {
  message: CardsMessage;
}
export function WidgetCardsMessage({message}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToStart, setIsScrolledToStart] = useState(true);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(
    message.body.items.length <= 1,
  );

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      const scrollHandler = () => {
        setIsScrolledToStart(scrollEl.scrollLeft === 0);
        setIsScrolledToEnd(
          scrollEl.scrollLeft + scrollEl.clientWidth === scrollEl.scrollWidth,
        );
      };

      scrollEl.addEventListener('scroll', scrollHandler);

      return () => {
        scrollEl.removeEventListener('scroll', scrollHandler);
      };
    }
  }, []);

  return (
    <AnimatedChatMessage className="relative" uuid={message.uuid}>
      <div
        className="hidden-scrollbar mb-12 flex snap-x snap-mandatory items-start gap-14 overflow-x-auto scroll-smooth"
        ref={scrollRef}
      >
        {message.body.items.map((item, index) => (
          <Card key={index} item={item} message={message} />
        ))}
      </div>
      <div className="pointer-events-none absolute top-0 flex h-full w-full items-center">
        <NavigationButton
          hidden={isScrolledToStart}
          className="mr-auto"
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollBy({
                left: -240,
                behavior: 'smooth',
              });
            }
          }}
        >
          <KeyboardArrowLeftIcon />
        </NavigationButton>
        <NavigationButton
          hidden={isScrolledToEnd}
          className="ml-auto"
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollBy({
                left: 240,
                behavior: 'smooth',
              });
            }
          }}
        >
          <KeyboardArrowRightIcon />
        </NavigationButton>
      </div>
    </AnimatedChatMessage>
  );
}

interface CardProps {
  item: CarouselItem;
  message: CardsMessage;
}
function Card({item, message: cardMessage}: CardProps) {
  const {handleButtonAction, isPending} = useHandleButtonAction(cardMessage);

  return (
    <div className="w-240 flex-shrink-0 snap-center overflow-hidden rounded-panel border shadow-sm">
      {item.image && (
        <img
          src={item.image}
          alt=""
          className="h-172 w-full rounded-t-panel object-cover"
        />
      )}
      <div className="px-20 pb-20 pt-16 text-sm">
        <div className="line-clamp-2 whitespace-pre-wrap break-words font-semibold">
          {item.title}
        </div>
        <div className="mt-8 line-clamp-4 whitespace-pre-wrap break-words">
          {item.description}
        </div>
      </div>
      {item.buttons.map((button, index) => (
        <div key={index}>
          <button
            disabled={isPending}
            className="h-44 w-full overflow-hidden overflow-ellipsis whitespace-nowrap border-t px-20 text-sm font-semibold text-primary transition-button hover:bg-hover focus-visible:outline-primary-light disabled:bg-disabled disabled:text-disabled"
            onClick={() => handleButtonAction(button)}
          >
            <Trans message={button.name} />
          </button>
        </div>
      ))}
    </div>
  );
}

interface NavigationButtonProps {
  children: ReactNode;
  onClick: () => void;
  hidden?: boolean;
  className?: string;
}
export function NavigationButton({
  children,
  onClick,
  hidden,
  className,
}: NavigationButtonProps) {
  return (
    <button
      className={clsx(
        'size-36 select-none rounded-full border bg shadow-[0_0_15px_0_rgba(0,0,0,.34)] outline-none transition-[opacity,color] hover:text-primary focus-visible:ring',
        hidden ? 'pointer-events-none opacity-0' : 'pointer-events-auto',
        className,
      )}
      onClick={() => onClick()}
    >
      {children}
    </button>
  );
}
