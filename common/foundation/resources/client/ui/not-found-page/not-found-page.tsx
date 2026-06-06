import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {Link} from 'react-router';
import imgUrl1 from './404-1.png';
import imgUrl2 from './404-2.png';

export function NotFoundPage() {
  return (
    <div className="isolate flex flex-col-reverse items-center justify-center gap-64 px-16 py-96 md:gap-112 md:px-176 md:py-80 lg:flex-row lg:px-96 lg:py-96">
      <div className="relative w-full pb-48 lg:pb-0 xl:w-1/2 xl:pt-96">
        <div className="relative">
          <div className="absolute">
            <div className="relative z-10">
              <h1 className="my-8 text-2xl font-bold text-main">
                <Trans message="Looks like you've found the doorway to the great nothing" />
              </h1>
              <p className="my-16 text-main">
                <Trans
                  message="Sorry about that! Please visit our homepage to get where you need
                to go."
                />
              </p>
              <Button
                className="my-8"
                elementType={Link}
                size="lg"
                to="/"
                variant="flat"
                color="primary"
              >
                <Trans message="Take me there!" />
              </Button>
            </div>
          </div>
          <div className="dark:opacity-5">
            <img src={imgUrl2 as any} alt="" />
          </div>
        </div>
      </div>
      <div className="dark:opacity-80">
        <img src={imgUrl1 as any} alt="" />
      </div>
    </div>
  );
}
