import { component$, Slot, useStyles$ } from '@builder.io/qwik';
import { RequestHandler, useLocation } from '@builder.io/qwik-city';
import { ContentNav } from '../../components/content-nav/content-nav';
import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';
import { OnThisPage } from '../../components/on-this-page/on-this-page';
import { SideBar } from '../../components/sidebar/sidebar';
import styles from './docs.css?inline';
import BuilderContentComp from '../../components/builder-content';
import { BUILDER_MODEL, BUILDER_PUBLIC_API_KEY } from '../../constants';

export default component$(() => {
  const loc = useLocation();
  const noRightMenu = ['/docs/overview/'].includes(loc.pathname);
  useStyles$(styles);

  return (
    <div class="docs fixed-header">
      <BuilderContentComp
        apiKey={BUILDER_PUBLIC_API_KEY}
        model={BUILDER_MODEL}
        tag="div"
        fixed={true}
      />
      <Header />
      <SideBar />
      <main
        class={{
          'no-right-menu': noRightMenu,
        }}
      >
        <div class="docs-container">
          <article>
            <Slot />
          </article>
          <ContentNav />
          <Footer />
        </div>
        <OnThisPage />
      </main>
    </div>
  );
});

export const onGet: RequestHandler = ({ response }) => {
  // cache for pages using this layout
  response.headers.set(
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
  );
};
