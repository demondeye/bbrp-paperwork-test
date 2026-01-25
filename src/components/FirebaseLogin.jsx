import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getDefaultInstalledApps } from '../utils/appRegistry';

export default function FirebaseLogin({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        // Signup
        if (!formData.username || !formData.password || !formData.confirmPassword || !formData.fullName) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Create full email with @bluebird.live domain
        const fullEmail = `${formData.username}@bluebird.live`;

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          fullEmail,
          formData.password
        );

        // Store user profile in Firestore with default installed apps
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: fullEmail,
          username: formData.username,
          fullName: formData.fullName,
          installedApps: getDefaultInstalledApps(), // Get from registry
          createdAt: new Date().toISOString()
        });

        // Auto login after signup
        onLogin({
          uid: userCredential.user.uid,
          email: fullEmail,
          username: formData.username,
          fullName: formData.fullName
        });

      } else {
        // Login
        if (!formData.username || !formData.password) {
          setError('Please enter username and password');
          setLoading(false);
          return;
        }

        // Create full email for login
        const fullEmail = `${formData.username}@bluebird.live`;

        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
          auth,
          fullEmail,
          formData.password
        );

        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          onLogin({
            uid: userCredential.user.uid,
            email: userData.email,
            username: userData.username,
            fullName: userData.fullName
          });
        } else {
          setError('User profile not found');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      // User-friendly error messages
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email already in use');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!isSignup ? (
          /* Windows 10 Style Login */
          <div className="text-center">
            {/* User Icon Circle */}
            <div className="mb-8 flex justify-center">
              <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
                <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-white/90 backdrop-blur-sm text-gray-800 rounded px-4 py-3 outline-none focus:bg-white transition-colors placeholder-gray-500"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  disabled={loading}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  @bluebird.live
                </span>
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-white/90 backdrop-blur-sm text-gray-800 rounded px-4 py-3 pr-12 outline-none focus:bg-white transition-colors placeholder-gray-500"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/90 backdrop-blur-sm text-white rounded px-4 py-3 text-sm text-center">
                  {error}
                </div>
              )}
            </form>

            {/* Sign Up Link */}
            <div className="mt-8">
              <button
                onClick={() => {
                  setIsSignup(true);
                  setError('');
                }}
                disabled={loading}
                className="text-white/80 hover:text-white text-sm transition-colors disabled:opacity-50"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </div>
        ) : (
          /* Signup Form - Keep existing style */
          <div>
            <div className="text-center mb-8">
              <div className="text-3xl font-light text-white mb-2">Create Account</div>
              <div className="text-white/60 text-sm">Victoria Police Report Management System</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <form onSubmit={handleSubmit} className="grid gap-4">
                {/* Username */}
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-white/90 text-gray-800 rounded px-3 py-2.5 pr-32 outline-none focus:bg-white placeholder-gray-500"
                    placeholder="Username *"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    disabled={loading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    @bluebird.live
                  </span>
                </div>

                {/* Password */}
                <input
                  type="password"
                  className="w-full bg-white/90 text-gray-800 rounded px-3 py-2.5 outline-none focus:bg-white placeholder-gray-500"
                  placeholder="Password (min 6 characters) *"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={loading}
                />

                {/* Confirm Password */}
                <input
                  type="password"
                  className="w-full bg-white/90 text-gray-800 rounded px-3 py-2.5 outline-none focus:bg-white placeholder-gray-500"
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  disabled={loading}
                />

                <div className="h-px bg-white/20 my-2"></div>

                {/* Full Name */}
                <input
                  type="text"
                  className="w-full bg-white/90 text-gray-800 rounded px-3 py-2.5 outline-none focus:bg-white placeholder-gray-500"
                  placeholder="Full Name (e.g. Tommy Pickles) *"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  disabled={loading}
                />

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/90 text-white rounded px-3 py-2.5 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-white/20 hover:bg-white/30 text-white rounded px-4 py-3 font-medium transition-colors mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignup(false);
                    setError('');
                  }}
                  disabled={loading}
                  className="text-white/70 hover:text-white text-sm transition-colors disabled:opacity-50"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
