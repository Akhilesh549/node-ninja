function About() {
  return (
    <main className="page page-narrow">
      <section className="content-panel">
        <p className="eyebrow">About the app</p>
        <h1>Built for quick waste sorting decisions.</h1>
        <p>
          This frontend captures an image from the device camera, sends the
          snapshot through the classifier function, and presents a disposal
          recommendation with a confidence score.
        </p>

        <div className="feature-grid">
          <article>
            <h2>Camera first</h2>
            <p>The scanner works directly from the browser using webcam access.</p>
          </article>
          <article>
            <h2>Clear output</h2>
            <p>Each result includes a category, confidence level, bin, and tip.</p>
          </article>
          <article>
            <h2>Backend ready</h2>
            <p>
              Replace the mock classifier in <code>src/utils/api.js</code> with a
              real API call when the model endpoint is available.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default About;
