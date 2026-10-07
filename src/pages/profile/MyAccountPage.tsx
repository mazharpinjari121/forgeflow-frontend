import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserCheck, Shield, Key, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { PageHeader } from "@/components/common";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

export default function MyAccountPage() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const isPasswordTab = location.pathname === "/profile/password";

  // Profile states
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");

  // Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Password strength checks SOW: min 8 chars, 1 uppercase, 1 number, 1 special char
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Full Name cannot be empty");
      return;
    }
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    if (user) {
      setUser({
        ...user,
        name: displayName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      toast.success("Profile details updated successfully!");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setPasswordError("User session not found.");
      return;
    }
    if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecial) {
      setPasswordError("New password does not satisfy complexity requirements");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      setLoadingPassword(true);
      setPasswordError("");

      const payload = {
        userId: Number(user.id),
        password: newPassword,
      };

      const response = await authService.resetPassword(payload);

      if (response.data.responseStatus === "Success") {
        Swal.fire({
          icon: "success",
          title: "Password Changed!",
          text: response.data.message || "Your security credentials have been updated successfully.",
          confirmButtonColor: "hsl(var(--accent))",
        });

        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
      } else {
        setPasswordError(response.data.message || "Failed to reset password.");
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      setPasswordError(error.response?.data?.message || "An error occurred while updating the password.");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={isPasswordTab ? "Change Password" : "My Account"}
        description={isPasswordTab ? "Secure your account credentials by changing your password." : "Manage your profile settings, username, and contact information."}
      />

      <div className="max-w-2xl mx-auto text-xs text-slate-800 px-1 sm:px-0">
        {!isPasswordTab ? (
          /* Profile settings */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 sm:p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UserCheck className="h-4.5 w-4.5 text-blue-600" />
              Profile Management
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label="Full Name *"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />

                <Input
                  type="text"
                  label="Username *"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <Input
                  type="text"
                  label="Contact Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                />

                <Input
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. corporate@supersteel.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Corporate Role (Read-only)</label>
                <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>{user?.role} Access level</span>
                </div>
              </div>

              <Button type="submit" className="w-full justify-center h-9 flex items-center gap-1.5 mt-2">
                <UserCheck className="h-4 w-4" />
                <span>Update Profile Details</span>
              </Button>
            </form>
          </div>
        ) : (
          /* Change Password */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 sm:p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Key className="h-4.5 w-4.5 text-amber-500" />
              Change Password Credentials
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <Input
                type="password"
                label="New Password *"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError("");
                }}
                required
              />

              {/* Validation checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-100 dark:border-slate-800 text-[10px] font-semibold">
                <div className="flex items-center gap-1">
                  {hasMinLength ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                  <span className={hasMinLength ? "text-emerald-700" : "text-slate-500"}>At least 8 chars</span>
                </div>
                <div className="flex items-center gap-1">
                  {hasUppercase ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                  <span className={hasUppercase ? "text-emerald-700" : "text-slate-500"}>1 Uppercase letter</span>
                </div>
                <div className="flex items-center gap-1">
                  {hasNumber ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                  <span className={hasNumber ? "text-emerald-700" : "text-slate-500"}>1 Number digit</span>
                </div>
                <div className="flex items-center gap-1">
                  {hasSpecial ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                  <span className={hasSpecial ? "text-emerald-700" : "text-slate-500"}>1 Special symbol</span>
                </div>
              </div>

              <Input
                type="password"
                label="Confirm New Password *"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
                required
              />

              <Button type="submit" loading={loadingPassword} className="w-full justify-center h-9 flex items-center gap-1.5">
                {!loadingPassword && <Key className="h-4 w-4" />}
                <span>Save Security Credentials</span>
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


