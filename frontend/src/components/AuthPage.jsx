export default function AuthPage({
    isRegistering,
    loginData,
    registerData,
    showPassword,
    showRegisterPassword,
    loading,
    message,
    onLogin,
    onRegister,
    onLoginChange,
    onRegisterChange,
    onTogglePassword,
    onToggleRegisterPassword,
    onSwitchToRegister,
    onSwitchToLogin,
    onForgotPassword
}) {
    return (
        <div className="app">
            <div className="noise-overlay" aria-hidden="true" />
            <div className="background-glow glow-one" aria-hidden="true" />
            <div className="background-glow glow-two" aria-hidden="true" />

            <main className="login-page">
                <section className="hero-section">
                    <div className="brand">
                        <div className="brand-icon">★</div>
                        <span>RateNest</span>
                    </div>

                    <div className="hero-content">
                        <div className="eyebrow">SMART STORE REVIEWS</div>

                        <h1>
                            {isRegistering ? (
                                <>
                                    Join.
                                    <br />
                                    <span>Rate.</span>
                                    <br />
                                    Discover.
                                </>
                            ) : (
                                <>
                                    Discover.
                                    <br />
                                    <span>Rate.</span>
                                    <br />
                                    Trust.
                                </>
                            )}
                        </h1>

                        <p>
                            {isRegistering
                                ? "Create your account and become part of a community making smarter store choices."
                                : "Find stores people love, share your experience, and make better choices with ratings that matter."}
                        </p>

                        <div className="feature-row">
                            <div className="feature">
                                <div className="feature-icon">★</div>
                                <div>
                                    <strong>Real ratings</strong>
                                    <small>Honest customer experiences</small>
                                </div>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">✓</div>
                                <div>
                                    <strong>Trusted reviews</strong>
                                    <small>Community-driven insights</small>
                                </div>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">→</div>
                                <div>
                                    <strong>Better decisions</strong>
                                    <small>Choose with confidence</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-footer">© 2026 RateNest</div>
                </section>

                <section className="form-section">
                    <div className="login-card">
                        <div className="mobile-brand">
                            <div className="brand-icon">★</div>
                            <span>RateNest</span>
                        </div>

                        {!isRegistering ? (
                            <>
                                <div className="form-heading">
                                    <p className="welcome">WELCOME BACK</p>
                                    <h2>Sign in to your account</h2>
                                    <p className="subtitle">
                                        Continue discovering great places.
                                    </p>
                                </div>

                                <form onSubmit={onLogin}>
                                    <div className="input-group">
                                        <label htmlFor="login-email">Email address</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">✉</span>
                                            <input
                                                id="login-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={loginData.email}
                                                onChange={(e) =>
                                                    onLoginChange({
                                                        ...loginData,
                                                        email: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <div className="label-row">
                                            <label htmlFor="login-password">Password</label>
                                            <button
                                                type="button"
                                                className="forgot"
                                                onClick={onForgotPassword}
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="input-wrapper">
                                            <span className="input-icon">●</span>
                                            <input
                                                id="login-password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                value={loginData.password}
                                                onChange={(e) =>
                                                    onLoginChange({
                                                        ...loginData,
                                                        password: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={onTogglePassword}
                                            >
                                                {showPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="login-button"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner" />
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Sign in
                                                <span>→</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                {message && (
                                    <div
                                        className={`message ${
                                            message.toLowerCase().includes("welcome")
                                                ? "success"
                                                : "error"
                                        }`}
                                        role="alert"
                                    >
                                        {message}
                                    </div>
                                )}

                                <div className="divider">
                                    <span>NEW TO RATENEST?</span>
                                </div>

                                <button
                                    type="button"
                                    className="signup-button"
                                    onClick={onSwitchToRegister}
                                >
                                    Create an account
                                </button>

                                <p className="terms">
                                    By continuing, you agree to our Terms of Service and
                                    Privacy Policy.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="form-heading">
                                    <p className="welcome">GET STARTED</p>
                                    <h2>Create your account</h2>
                                    <p className="subtitle">
                                        Join RateNest and start sharing your experience.
                                    </p>
                                </div>

                                <form onSubmit={onRegister}>
                                    <div className="input-group">
                                        <label htmlFor="register-name">
                                            Full name
                                            <span className="hint"> 20–60 characters</span>
                                        </label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">♙</span>
                                            <input
                                                id="register-name"
                                                type="text"
                                                placeholder="Enter your full name"
                                                value={registerData.name}
                                                onChange={(e) =>
                                                    onRegisterChange({
                                                        ...registerData,
                                                        name: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="register-email">Email address</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">✉</span>
                                            <input
                                                id="register-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={registerData.email}
                                                onChange={(e) =>
                                                    onRegisterChange({
                                                        ...registerData,
                                                        email: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="register-address">
                                            Address
                                            <span className="hint"> up to 400 characters</span>
                                        </label>
                                        <div className="input-wrapper textarea-wrapper">
                                            <span className="input-icon">⌖</span>
                                            <textarea
                                                id="register-address"
                                                placeholder="Enter your address"
                                                value={registerData.address}
                                                onChange={(e) =>
                                                    onRegisterChange({
                                                        ...registerData,
                                                        address: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="register-password">Password</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">●</span>
                                            <input
                                                id="register-password"
                                                type={
                                                    showRegisterPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Create a strong password"
                                                value={registerData.password}
                                                onChange={(e) =>
                                                    onRegisterChange({
                                                        ...registerData,
                                                        password: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={onToggleRegisterPassword}
                                            >
                                                {showRegisterPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                        <div className="password-hint">
                                            8–16 characters • 1 uppercase • 1 special character
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="login-button"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner" />
                                                Creating account...
                                            </>
                                        ) : (
                                            <>
                                                Create account
                                                <span>→</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                {message && (
                                    <div
                                        className={`message ${
                                            message.toLowerCase().includes("successfully")
                                                ? "success"
                                                : "error"
                                        }`}
                                        role="alert"
                                    >
                                        {message}
                                    </div>
                                )}

                                <div className="divider">
                                    <span>ALREADY HAVE AN ACCOUNT?</span>
                                </div>

                                <button
                                    type="button"
                                    className="signup-button"
                                    onClick={onSwitchToLogin}
                                >
                                    ← Back to sign in
                                </button>
                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
