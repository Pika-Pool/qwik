import { component$, Resource, useResource$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { getBuilderSearchParams, getContent, RenderContent } from '@builder.io/sdk-qwik';

export const FIXED = {
  position: 'fixed',
  top: '0px',
  right: '0px',
  left: '0px',
};

export default component$<{
  html?: any;
  apiKey: string;
  model: string;
  tag: 'main' | 'div';
  fixed?: boolean;
}>((props) => {
  const location = useLocation();
  const query = location.query;
  const render =
    typeof query.get === 'function' ? query.get('render') : (query as { render?: string }).render;
  const isSDK = render === 'sdk';
  const builderContentRsrc = useResource$<any>(() => {
    if (isSDK) {
      return getContent({
        model: props.model!,
        apiKey: props.apiKey!,
        options: getBuilderSearchParams(location.query),
        userAttributes: {
          urlPath: location.pathname,
        },
      });
    } else if (props.html) {
      return { html: props.html };
    } else {
      return getBuilderContent(props.apiKey, props.model, location.pathname);
    }
  });

  return (
    <div style={props.fixed ? FIXED : undefined}>
      {props.fixed ? <style>{`:root{--builder-bar-height: 50px;}`}</style> : undefined}
      <Resource
        value={builderContentRsrc}
        onPending={() => <div>Loading...</div>}
        onResolved={(content) =>
          content.html ? (
            <props.tag class="builder" dangerouslySetInnerHTML={content.html} />
          ) : (
            <RenderContent model={props.model} content={content} apiKey={props.apiKey} />
          )
        }
      />
    </div>
  );
});

export interface BuilderContent {
  html: string;
}

export async function getBuilderContent(
  apiKey: string,
  model: string,
  urlPath: string
): Promise<BuilderContent> {
  const qwikUrl = new URL('https://cdn.builder.io/api/v1/qwik/' + model);
  qwikUrl.searchParams.set('apiKey', apiKey);
  qwikUrl.searchParams.set('userAttributes.urlPath', urlPath);

  const response = await fetch(qwikUrl.href);
  if (response.ok) {
    const content: BuilderContent = JSON.parse(await response.text());
    return content;
  }
  throw new Error('Unable to load Builder content');
}
