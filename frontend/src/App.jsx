
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem("lmsToken"));
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });

  const [code, setCode] = useState("import os\n\nx = 10\nprint(x)");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [mentorFeedback, setMentorFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [activeView, setActiveView] = useState("dashboard");

  const fetchReviewHistory = async (authToken) => {
    if (!authToken) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(`${API_URL}/api/my/reviews`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not load review history.");
      }

      setHistory(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (err) {
      setHistoryError(err.message || "Could not load review history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Retrieve feedback belonging only to the authenticated student.
  const fetchMentorFeedback = async (authToken) => {
    if (!authToken) return;

    setFeedbackLoading(true);
    setFeedbackError("");

    try {
      const response = await fetch(`${API_URL}/api/my/mentor-feedback`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Could not load mentor feedback."
        );
      }

      setMentorFeedback(
        Array.isArray(data.feedback) ? data.feedback : []
      );
    } catch (err) {
      setFeedbackError(
        err.message || "Could not load mentor feedback."
      );
    } finally {
      setFeedbackLoading(false);
    }
  };

  const refreshStudentData = async (authToken) => {
    await Promise.all([
      fetchReviewHistory(authToken),
      fetchMentorFeedback(authToken)
    ]);
  };

  useEffect(() => {
    if (!token) return;

    const verifySession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Session expired");

        const data = await response.json();
        setUser(data.user);

        await refreshStudentData(token);
      } catch {
        sessionStorage.removeItem("lmsToken");
        setToken(null);
        setUser(null);
        setHistory([]);
        setMentorFeedback([]);
      }
    };

    verifySession();
  }, [token]);

  const handleAuthInput = (event) => {
    setAuthForm({
      ...authForm,
      [event.target.name]: event.target.value
    });
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setSuccessMessage("");

    try {
      const endpoint = authMode === "register" ? "register" : "login";

      const body = authMode === "register"
        ? authForm
        : {
            email: authForm.email,
            password: authForm.password
          };

      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Authentication failed."
        );
      }

      if (authMode === "register") {
        setSuccessMessage("Account created successfully! Please log in.");
        setAuthMode("login");
        setAuthForm({
          name: "",
          email: authForm.email,
          password: ""
        });
      } else {
        sessionStorage.setItem("lmsToken", data.token);
        setToken(data.token);
        setUser(data.user);

        setAuthForm({
          name: "",
          email: "",
          password: ""
        });

        await refreshStudentData(data.token);
      }
    } catch (err) {
      setAuthError(
        err.message || "Could not connect to the LMS backend."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("lmsToken");

    setToken(null);
    setUser(null);
    setReview(null);
    setHistory([]);
    setMentorFeedback([]);
    setError("");
    setHistoryError("");
    setFeedbackError("");
    setActiveView("dashboard");
    setAuthMode("login");
    setSuccessMessage("");
  };

  const submitCode = async (event) => {
    event.preventDefault();

    if (!code.trim()) {
      setError("Please enter your code before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setReview(null);

    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          submission_id: crypto.randomUUID(),
          assignment_id: "22222222-2222-4222-8222-222222222222",
          student_id: user.id,
          language: "python",
          files: {
            "main.py": code
          },
          assignment_context:
            "Write a Python program and submit it for code review."
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Review request failed."
        );
      }

      setReview(data);
      setActiveView("dashboard");

      await refreshStudentData(token);
    } catch (err) {
      setError(
        err.message || "Could not connect to the LMS backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const openSavedReview = (item) => {
    setReview(item.result || null);
    setActiveView("dashboard");
    window.location.hash = "results";

    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({
        behavior: "smooth"
      });
    }, 100);
  };

  const getFeedbackForSubmission = (submissionId) => {
    return mentorFeedback.filter(
      (item) => item.submissionId === submissionId
    );
  };

  const renderMentorFeedback = (feedback) => (
    <div className="mentor-feedback-card">
      <div className="mentor-feedback-header">
        <div>
          <span className="eyebrow">MENTOR REVIEW</span>
          <h3>Feedback from your mentor</h3>
        </div>

        <span className="completed-tag">Received</span>
      </div>

      <div className="mentor-rating">
        <strong>{feedback.rating} / 5</strong>
        <span>Mentor rating</span>
      </div>

      <div className="mentor-message">
        <strong>Mentor's message</strong>
        <p>{feedback.message}</p>
      </div>

      <div className="mentor-feedback-meta">
        <span>
          Mentor: {feedback.mentorId?.name || "Your mentor"}
        </span>

        <span>
          {feedback.createdAt
            ? new Date(feedback.createdAt).toLocaleString()
            : "Date unavailable"}
        </span>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-icon">R</div>
            <div>
              <h2>RaushByte Learn</h2>
              <span>AI-POWERED LEARNING PLATFORM</span>
            </div>
          </div>

          <div className="auth-heading">
            <span className="eyebrow">
              YOUR LEARNING JOURNEY STARTS HERE
            </span>

            <h1>
              {authMode === "login"
                ? "Welcome back!"
                : "Create your account"}
            </h1>

            <p>
              {authMode === "login"
                ? "Log in to continue learning and improving your coding skills."
                : "Join RaushByte Learn and start improving your programming skills."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={authMode === "login" ? "selected" : ""}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
                setSuccessMessage("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={authMode === "register" ? "selected" : ""}
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
                setSuccessMessage("");
              }}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={submitAuth}>
            {authMode === "register" && (
              <label>
                Full name

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={authForm.name}
                  onChange={handleAuthInput}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}

            <label>
              Email address

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={authForm.email}
                onChange={handleAuthInput}
                required
              />
            </label>

            <label>
              Password

              <input
                type="password"
                name="password"
                placeholder="At least 8 characters"
                value={authForm.password}
                onChange={handleAuthInput}
                minLength={8}
                maxLength={128}
                required
              />
            </label>

            {authError && (
              <div className="error-message">{authError}</div>
            )}

            {successMessage && (
              <div className="success-message">{successMessage}</div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Log In to Dashboard"
                  : "Create Student Account"}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "New to RaushByte Learn? "
              : "Already have an account? "}

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                );
                setAuthError("");
                setSuccessMessage("");
              }}
            >
              {authMode === "login" ? "Create account" : "Log in"}
            </button>
          </p>

          <div className="auth-security">
            <span>🔒</span> Your account is protected with secure authentication.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>RaushByte</h2>
            <span>LEARN PLATFORM</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          <a
            className={`nav-item ${
              activeView === "dashboard" ? "active" : ""
            }`}
            href="#dashboard"
            onClick={() => setActiveView("dashboard")}
          >
            ▦ <span>Dashboard</span>
          </a>

          <a
            className="nav-item"
            href="#editor"
            onClick={() => setActiveView("dashboard")}
          >
            ⌘ <span>Code Review</span>
          </a>

          <button
            type="button"
            className={`nav-item history-nav ${
              activeView === "history" ? "active" : ""
            }`}
            onClick={() => setActiveView("history")}
          >
            ▤ <span>Review History</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="profile-info">
            <strong>{user.name}</strong>
            <span>Student account</span>
            <button className="logout-button" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              Workspace /{" "}
              {activeView === "history"
                ? "Review History"
                : "Dashboard"}
            </span>

            <h1>
              {activeView === "history"
                ? "Review History"
                : "Student Dashboard"}
            </h1>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            AI Review System
          </div>
        </header>

        {activeView === "history" ? (
          <section className="history-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  YOUR PAST SUBMISSIONS
                </span>

                <h2>Review History</h2>

                <p>
                  See your saved code reviews and feedback from your mentor.
                </p>
              </div>

              <button
                type="button"
                className="history-refresh"
                onClick={() => refreshStudentData(token)}
                disabled={historyLoading || feedbackLoading}
              >
                {historyLoading || feedbackLoading
                  ? "Loading..."
                  : "Refresh"}
              </button>
            </div>

            {historyError && (
              <div className="error-message">{historyError}</div>
            )}

            {feedbackError && (
              <div className="error-message">{feedbackError}</div>
            )}

            {historyLoading && (
              <p>Loading your saved reviews...</p>
            )}

            {!historyLoading && history.length === 0 && (
              <div className="history-empty">
                <span>▤</span>
                <h3>No reviews yet</h3>
                <p>
                  Submit your first Python program to see it here.
                </p>

                <button
                  type="button"
                  onClick={() => setActiveView("dashboard")}
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {history.map((item) => {
              const submissionFeedback =
                getFeedbackForSubmission(item.submissionId);

              return (
                <article className="history-card" key={item._id}>
                  <div className="history-card-main">
                    <div className="history-file-icon">PY</div>

                    <div>
                      <h3>Code submission</h3>

                      <p>
                        {item.language || "python"} ·{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>

                      <span>
                        {item.result?.total_issues ?? 0} issues found
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="history-view-button"
                    onClick={() => openSavedReview(item)}
                    disabled={!item.result}
                  >
                    View Review
                  </button>

                  {submissionFeedback.length > 0 && (
                    <div className="history-mentor-feedback">
                      {submissionFeedback.map((feedback) => (
                        <div key={feedback._id}>
                          {renderMentorFeedback(feedback)}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        ) : (
          <>
            <section className="welcome-section">
              <div>
                <span className="eyebrow">
                  YOUR LEARNING SPACE
                </span>

                <h2>Welcome back, {user.name}! 👋</h2>

                <p>
                  Write code, get intelligent feedback, and improve your programming skills.
                </p>
              </div>

              <div className="welcome-decoration">{"</>"}</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">⌘</div>
                <span>Total Reviews</span>
                <strong>{history.length}</strong>
                <small>Saved reviews</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">✓</div>
                <span>Review Status</span>
                <strong>{review ? "Completed" : "Ready"}</strong>
                <small>AI analysis availability</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✦</div>
                <span>Mentor Feedback</span>
                <strong>{mentorFeedback.length}</strong>
                <small>Feedback received</small>
              </div>
            </section>

            <section className="mentor-feedback-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    HUMAN MENTOR REVIEW
                  </span>

                  <h2>Feedback from Your Mentor</h2>

                  <p>
                    Read the ratings and guidance your mentor has sent you.
                  </p>
                </div>

                <button
                  type="button"
                  className="history-refresh"
                  onClick={() => fetchMentorFeedback(token)}
                  disabled={feedbackLoading}
                >
                  {feedbackLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {feedbackError && (
                <div className="error-message">{feedbackError}</div>
              )}

              {feedbackLoading && (
                <p>Loading mentor feedback...</p>
              )}

              {!feedbackLoading &&
                !feedbackError &&
                mentorFeedback.length === 0 && (
                  <div className="history-empty">
                    <h3>No mentor feedback yet</h3>
                    <p>
                      When your mentor reviews a submission and sends feedback,
                      it will appear here.
                    </p>
                  </div>
                )}

              {!feedbackLoading &&
                mentorFeedback.map((feedback) => (
                  <div key={feedback._id}>
                    <div className="mentor-submission-reference">
                      Submission ID: {feedback.submissionId}
                    </div>

                    {renderMentorFeedback(feedback)}
                  </div>
                ))}
            </section>

            <section className="editor-section" id="editor">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    PRACTICE & IMPROVE
                  </span>

                  <h2>Submit Your Code</h2>

                  <p>
                    Paste your Python code below to receive an AI-powered review.
                  </p>
                </div>

                <span className="language-tag">● Python</span>
              </div>

              <form onSubmit={submitCode}>
                <div className="editor-toolbar">
                  <span><i></i> main.py</span>
                  <span>Python 3</span>
                </div>

                <textarea
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  spellCheck="false"
                  aria-label="Python code editor"
                  placeholder="Write your Python code here..."
                />

                <div className="editor-footer">
                  <span>
                    AI-powered static analysis and feedback
                  </span>

                  <button type="submit" disabled={loading}>
                    {loading
                      ? "Analyzing code..."
                      : "✦  Review My Code"}
                  </button>
                </div>
              </form>

              {error && (
                <div className="error-message">{error}</div>
              )}
            </section>

            {review && (
              <section className="results-section" id="results">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">AI ANALYSIS</span>
                    <h2>Your Review Results</h2>
                    <p>{review.summary}</p>
                  </div>

                  <span className="completed-tag">
                    ✓ {review.status}
                  </span>
                </div>

                <div className="result-summary">
                  <div>
                    <strong>{review.total_issues}</strong>
                    <span>Issues found</span>
                  </div>

                  <div>
                    <strong>{review.total_files}</strong>
                    <span>Files reviewed</span>
                  </div>

                  <div>
                    <strong>
                      {review.database?.saved ? "Saved" : "Saved review"}
                    </strong>
                    <span>Database status</span>
                  </div>
                </div>

                <h3>Issues to improve</h3>

                {review.issues?.length
                  ? review.issues.map((issue, index) => (
                      <div className="issue-card" key={index}>
                        <span className="warning-tag">
                          {issue.severity}
                        </span>

                        <strong>{issue.explanation}</strong>

                        <p>{issue.suggested_improvement}</p>

                        <small>
                          {issue.file_name} · Line {issue.line}
                        </small>
                      </div>
                    ))
                  : <p>No issues found!</p>}

                <h3>Strengths</h3>

                <ul className="feedback-list">
                  {review.strengths?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <h3>Suggestions</h3>

                <ul className="feedback-list">
                  {review.suggestions?.map((item, index) => (
                    <li key={index}>
                      <strong>{item.category}:</strong> {item.message}
                    </li>
                  ))}
                </ul>

                <div className="overall-feedback">
                  <strong>Overall Feedback</strong>

                  <p>{review.overall_feedback}</p>

                  <small>
                    Database review ID:{" "}
                    {review.database?.reviewId || "Previously saved review"}
                  </small>
                </div>
              </section>
            )}
          </>
        )}

        <footer>
          © 2026 RaushByte Learn · AI-powered Code Review LMS
        </footer>
      </main>
    </div>
  );
}

export default App;
