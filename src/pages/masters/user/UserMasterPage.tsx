import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, Edit2, Trash2, ShieldAlert, UserCheck, Lock, Eye, EyeOff, X, AlertCircle, SlidersHorizontal, FilterX, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, Loader, FilterDrawer } from "@/components/common";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { userService } from "@/services/user.service";
import type { UserRecord } from "@/types/api.types";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";

export default function UserMasterPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    return [
      roleFilter !== "all"
    ].filter(Boolean).length;
  }, [roleFilter]);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" || roleFilter !== "all";
  }, [searchTerm, roleFilter]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setRoleFilter("all");
  }, []);

  // Form States
  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Staff");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Role Access Guard: SOW states Admin only has access to User Master!
  if (currentUser?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The User Master module is restricted to **Administrator** accounts only. Managers and Staff do not have viewing or modification permissions.
        </p>
      </div>
    );
  }

  const fetchUsers = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers(search);
      if (response.data.responseStatus === "Success" && response.data.data) {
        setUsers(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load users");
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "Admin") {
      fetchUsers(searchTerm);
    }
  }, [fetchUsers, searchTerm, currentUser?.role]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUserName("");
    setFullName("");
    setMobile("");
    setEmail("");
    setRole("Staff");
    setPassword("");
    setShowPassword(false);
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user);
    setUserName(user.userName);
    setFullName(user.fullName || "");
    setMobile(user.mobileNo);
    setEmail(user.email || user.emailID || "");
    setRole(user.role);
    setPassword(""); // don't show old password
    setShowPassword(false);
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (user: UserRecord) => {
    Swal.fire({
      title: "Delete User?",
      text: `Are you sure you want to delete user "${user.userName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "hsl(var(--destructive))",
      cancelButtonColor: "hsl(var(--muted-foreground))",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await userService.deleteUser(user.userId, 1);
          if (response.data.responseStatus === "Success") {
            toast.success("User deleted successfully");
            fetchUsers(searchTerm);
          } else {
            toast.error(response.data.message || "Failed to delete user");
          }
        } catch (error: any) {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user. Please try again.");
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUserName = userName.trim();
    const trimmedFullName = fullName.trim();
    const trimmedMobile = mobile.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedFullName) return setError("Full name is required");
    if (!trimmedUserName) return setError("Username is required");
    if (!/^[A-Za-z0-9_-]+$/.test(trimmedUserName)) return setError("Username can only contain alphanumeric characters, underscores, and hyphens");
    if (!/^[6-9]\d{9}$/.test(trimmedMobile)) return setError("Valid 10-digit mobile is required");
    if (!editingUser && !trimmedPassword) return setError("Password is required");
    if (trimmedPassword && trimmedPassword.length < 6) return setError("Password must be at least 6 characters");

    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = {
          userId: editingUser.userId,
          userName: trimmedUserName,
          fullName: trimmedFullName,
          email: trimmedEmail,
          emailID: trimmedEmail,
          mobileNo: trimmedMobile,
          password: trimmedPassword ? trimmedPassword : undefined,
          role,
          updatedBy: 1, // Default user ID for now
        };

        const response = await userService.updateUser(payload as any);
        if (response.data.responseStatus === "Success") {
          toast.success("User updated successfully");
          fetchUsers(searchTerm);
          setIsModalOpen(false);
        } else {
          toast.error(response.data.message || "Failed to update user");
        }
      } else {
        const payload = {
          userName: trimmedUserName,
          fullName: trimmedFullName,
          email: trimmedEmail,
          emailID: trimmedEmail,
          mobileNo: trimmedMobile,
          password: trimmedPassword,
          role,
          createdBy: 1, // Default user ID for now
        };

        const response = await userService.addUser(payload);
        if (response.data.responseStatus === "Success") {
          toast.success("User created successfully");
          fetchUsers(searchTerm);
          setIsModalOpen(false);
        } else {
          toast.error(response.data.message || "Failed to create user");
        }
      }
    } catch (err: any) {
      console.error("Error submitting user:", err);
      toast.error(err.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch = !searchTerm ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mobileNo?.includes(searchTerm) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.emailID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userId.toString().includes(searchTerm);
    return matchesRole && matchesSearch;
  });

  const fullNameError = (error.toLowerCase().includes("full name") || error.toLowerCase().includes("fullname")) ? error : "";
  const usernameError = error.toLowerCase().includes("username") ? error : "";
  const mobileError = error.toLowerCase().includes("mobile") ? error : "";
  const passwordError = error.toLowerCase().includes("password") ? error : "";
  const generalError = error && !fullNameError && !usernameError && !mobileError && !passwordError ? error : "";

  return (
    <div className="flex-grow flex flex-col gap-4">
      <PageHeader
        title="User Master"
        description="Manage system accounts, specify roles (Admin/Manager/Staff), and restrict access."
        entriesCount={filteredUsers.length}
        entriesLabel="Users"
      />

      {/* Filter and Actions Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2 flex-grow">
          <div className="flex-grow max-w-full lg:max-w-md">
            <SearchInput
              placeholder="Search name, ID or mobile..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full"
            />
          </div>

          {/* Mobile Filter Trigger Button (hidden on desktop lg) */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            type="button"
            className={`lg:hidden h-9 px-3 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${activeFiltersCount > 0
              ? "border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400"
              : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-bold text-white leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Mobile Add User Button (hidden on desktop lg) */}
          <button
            onClick={handleOpenAdd}
            className="lg:hidden flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95"
            title="Add User"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Quick Filters for Desktop (lg and up) */}
          <div className="hidden lg:flex items-center gap-3">
            <SearchableSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "all", label: "All Roles" },
                { value: "Admin", label: "Admin" },
                { value: "Manager", label: "Manager" },
                { value: "Staff", label: "Staff" },
              ]}
              className="w-40 font-semibold"
            />
          </div>

          {/* Clear Filters Button (Mobile & Desktop) */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              type="button"
              className="h-9 px-2 text-red-655 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              title="Clear all active filters"
            >
              <FilterX className="h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>

        {/* Add User Button (hidden on mobile, visible on lg) */}
        <button
          onClick={handleOpenAdd}
          className="hidden lg:flex h-9 px-3 gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold transition-all shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95 items-center justify-center"
          title="Add User"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs px-1 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1.5">
            Active Filters:
          </span>

          {roleFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-95/30 text-blue-755 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>Role: {roleFilter}</span>
              <button onClick={() => setRoleFilter("all")} className="hover:text-blue-955 dark:hover:text-blue-200 transition-colors cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearFilters}
            className="text-[10px] text-red-500 hover:text-red-750 hover:underline font-bold transition-all ml-1.5 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Right sliding Filter Drawer Sidebar */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Users"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>User Role</span>
          </label>
          <SearchableSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: "all", label: "All Roles" },
              { value: "Admin", label: "Admin" },
              { value: "Manager", label: "Manager" },
              { value: "Staff", label: "Staff" },
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>
      </FilterDrawer>

      {/* User Table */}
      <DataTable
        loading={loading}
        loadingText="Loading users..."
        headers={[
          "#",
          "Full Name / Username",
          "Mobile",
          "Email",
          "Role",
          "Status",
          "Actions",
        ]}
        headerClassNames={[
          "",
          "",
          "",
          "",
          "",
          "",
          "text-right",
        ]}
        emptyMessage="No users found."
      >
        {filteredUsers.map((u) => (
          <tr key={u.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{u.userId}</td>

            <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {(u.fullName || u.userName).slice(0, 2)}
                </div>
                <div>
                  <span className="font-semibold block text-slate-800 dark:text-slate-200">{u.fullName || "—"}</span>
                  <span className="text-[10px] text-slate-400 font-normal block">{u.userName}</span>
                </div>
              </div>
            </td>
            <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">{u.mobileNo}</td>
            <td className="p-3.5 text-slate-500 whitespace-nowrap">
              {u.email || u.emailID || "—"}
            </td>
            <td className="p-3.5 whitespace-nowrap">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {u.role}
              </span>
            </td>
            <td className="p-3.5 whitespace-nowrap">
              <Badge variant={u.status ? "success" : "neutral"}>
                {u.status ? "Active" : "Inactive"}
              </Badge>
            </td>
            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
              <button
                onClick={() => handleOpenEdit(u)}
                className="p-1 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit details"
                disabled={submitting}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(u)}
                className="p-1 hover:text-red-655 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete user"
                disabled={submitting}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingUser ? "Edit User details" : "Add New User"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
                aria-label="Close"
                disabled={submitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {generalError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400 font-medium">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <Input
                label="Full Name *"
                type="text"
                placeholder="e.g. Vikram Sharma"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError("");
                }}
                error={fullNameError}
                disabled={submitting}
              />

              {!editingUser && (
                <Input
                  label="Username *"
                  type="text"
                  placeholder="e.g. vikram_sharma"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setError("");
                  }}
                  error={usernameError}
                  disabled={submitting}
                />
              )}

              <Input
                label="Mobile *"
                type="text"
                placeholder="10-digit number"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setError("");
                }}
                error={mobileError}
                maxLength={10}
                className="font-mono"
                disabled={submitting}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">Role *</label>
                <SearchableSelect
                  value={role}
                  onChange={(val) => setRole(val as any)}
                  options={[
                    { value: "Admin", label: "Admin" },
                    { value: "Manager", label: "Manager" },
                    { value: "Staff", label: "Staff" },
                  ]}
                  className="w-full text-xs font-semibold"
                  disabled={submitting}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. vishal@supersteel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />

              {!editingUser && (
                <div className="space-y-1.5">
                  <label className={`font-semibold ${passwordError ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className={`input-base pl-8 pr-10 font-mono ${passwordError ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : ""}`}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {passwordError && (
                      <div className="absolute inset-y-0 right-8 flex items-center pr-2.5 pointer-events-none">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {passwordError && (
                    <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{passwordError}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                >
                  {!submitting && <UserCheck className="h-4 w-4" />}
                  <span>{editingUser ? "Save Changes" : "Register User"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
