import React, { useEffect } from 'react';

declare global {
  interface Window {
    disqus_config?: (this: {
      page: {
        url: string;
        identifier: string;
      };
    }) => void;
    DISQUS?: {
      reset: (options: {
        reload: boolean;
        config?: (this: {
          page: {
            url: string;
            identifier: string;
          };
        }) => void;
      }) => void;
    };
  }
}

export const DisqusComments: React.FC = () => {
  useEffect(() => {
    const pageUrl = 'https://mgmt-6110-problem-set-2-bus-where-5.vercel.app/';
    const pageIdentifier = 'home';

    window.disqus_config = function () {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
    };

    const scriptId = 'disqus-universal-code';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://mgmt6110ps3buswhere.disqus.com/embed.js';
      script.setAttribute('data-timestamp', String(+new Date()));
      script.async = true;
      (document.head || document.body).appendChild(script);
    } else if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: function () {
          this.page.url = pageUrl;
          this.page.identifier = pageIdentifier;
        },
      });
    }
  }, []);

  return (
    <section id="disqus-comments-section" className="mt-12 pt-8 border-t border-zinc-200">
      <p className="text-sm font-medium text-zinc-700 mb-4">
        Tell us what worked for you and what did not — your feedback helps us improve.
      </p>
      <div id="disqus_thread" />
      <noscript>
        Please enable JavaScript to view the{' '}
        <a href="https://disqus.com/?ref_noscript" className="underline text-red-600">
          comments powered by Disqus.
        </a>
      </noscript>
    </section>
  );
};
