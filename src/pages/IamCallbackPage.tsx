import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { iamClient } from '@/iam';
import '@/styles/auth.css';

export default function IamCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await iamClient.handleCallback();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Callback failed');
      }
    })();
  }, []);

  return (
    <main>
      <section className="section section--centered">
        <div className="container">
          <div className="signin-card reveal" role={error ? 'alert' : 'status'}>
            <div className="eyebrow eyebrow--muted">IAM authorization</div>
            <h2 className="section-head__title" style={{ margin: '8px 0 16px', fontSize: 24 }}>
              {error ? 'Sign in could not be completed' : 'Completing sign in...'}
            </h2>
            {error ? (
              <>
                <p className="signin-error is-visible">{error}</p>
                <Link className="btn btn--accent signin-submit" to="/login">
                  Return to sign in
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Please wait while we verify your session.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
