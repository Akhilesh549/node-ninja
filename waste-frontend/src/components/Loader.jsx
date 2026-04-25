function Loader() {
  return (
    <div className="loader-card" role="status" aria-live="polite">
      <div className="loader-ring" aria-hidden="true" />
      <p>Analyzing waste item...</p>
    </div>
  );
}

export default Loader;
