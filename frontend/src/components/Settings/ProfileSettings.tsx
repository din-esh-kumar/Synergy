// import { useState, useEffect } from "react";
// import { useAuth } from "../../context/AuthContext";
// import { settingsService } from "../../services/settings.service";
// import Loader from "../common/Loader";

// export default function ProfileSettings() {
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         // still call to keep future extensibility, but we ignore avatar
//         await settingsService.getSettings();
//       } catch (error) {
//         console.error("Error loading settings:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   if (loading) return <Loader />;

//   return (
//     <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl">
//       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
//         Profile Settings
//       </h2>

//       <div className="space-y-6">
//         {/* Name */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Name
//           </label>
//           <input
//             type="text"
//             value={user?.name || ""}
//             disabled
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
//           />
//         </div>

//         {/* Email */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Email
//           </label>
//           <input
//             type="email"
//             value={user?.email || ""}
//             disabled
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
//           />
//         </div>

//         {/* Role */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Role
//           </label>
//           <input
//             type="text"
//             value={user?.role || ""}
//             disabled
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }



















// import { useState, useEffect, ChangeEvent, FormEvent } from "react";
// import { useAuth } from "../../context/AuthContext";
// import { settingsService } from "../../services/settings.service";
// import Loader from "../common/Loader";

// export default function ProfileSettings() {
//   const { user, setUser } = useAuth() as any; // adjust type if needed

//   const [name, setName] = useState(user?.name || "");
//   const [phone, setPhone] = useState(user?.phone || "");
//   const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
//   const [saving, setSaving] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         await settingsService.getSettings();
//       } catch (err) {
//         console.error("Error loading settings:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   // Keep form in sync if user context changes (e.g., after refresh)
//   useEffect(() => {
//     setName(user?.name || "");
//     setPhone(user?.phone || "");
//     setAvatarUrl(user?.avatar || "");
//   }, [user]);

//   const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // For now just store local preview URL; hook this to real upload later.
//     const previewUrl = URL.createObjectURL(file);
//     setAvatarUrl(previewUrl);
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setSaving(true);
//     setError(null);
//     setSuccess(null);

//     try {
//       const payload = { name, phone, avatarUrl };
//       const response = await settingsService.updateProfile(payload);
//       const updatedUser = response.data.user;

//       // Update auth context + localStorage so rest of app sees new values
//       setUser?.(updatedUser);
//       localStorage.setItem("user", JSON.stringify(updatedUser));

//       setSuccess("Profile updated successfully.");
//     } catch (err: any) {
//       console.error("Error updating profile:", err);
//       setError(err?.response?.data?.message || "Failed to update profile.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <Loader />;

//   return (
//     <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl">
//       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
//         Profile Settings
//       </h2>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Avatar */}
//         <div className="flex items-center gap-4">
//           <div className="w-16 h-16 rounded-full bg-slate-600 overflow-hidden flex items-center justify-center">
//             {avatarUrl ? (
//               <img
//                 src={avatarUrl}
//                 alt="Avatar"
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <span className="text-sm text-white">No Avatar</span>
//             )}
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
//               Avatar
//             </label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleAvatarChange}
//               className="text-sm text-gray-700 dark:text-gray-200"
//             />
//             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//               Choose an image to update your profile picture.
//             </p>
//           </div>
//         </div>

//         {/* Name (editable) */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Name
//           </label>
//           <input
//             type="text"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
//           />
//         </div>

//         {/* Phone (editable) */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Phone Number
//           </label>
//           <input
//             type="tel"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
//             placeholder="Enter phone number"
//           />
//         </div>

//         {/* Email (read-only) */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Email
//           </label>
//           <input
//             type="email"
//             value={user?.email || ""}
//             disabled
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
//           />
//         </div>

//         {/* Role (read-only) */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Role
//           </label>
//           <input
//             type="text"
//             value={user?.role || ""}
//             disabled
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
//           />
//         </div>

//         {error && (
//           <p className="text-sm text-red-500">
//             {error}
//           </p>
//         )}
//         {success && (
//           <p className="text-sm text-green-500">
//             {success}
//           </p>
//         )}

//         <button
//           type="submit"
//           disabled={saving}
//           className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-blue-400"
//         >
//           {saving ? "Saving..." : "Save Changes"}
//         </button>
//       </form>
//     </div>
//   );
// }













// import { useState, useEffect, ChangeEvent, FormEvent } from "react";
// import { useAuth } from "../../context/AuthContext";
// import { settingsService } from "../../services/settings.service";
// import Loader from "../common/Loader";

// export default function ProfileSettings() {
//   const { user, refreshUser } = useAuth();

//   // Do NOT read user.phone / user.avatar – they are not in User type
//   const [name, setName] = useState(user?.name || "");
//   const [phone, setPhone] = useState<string>("");
//   const [avatarUrl, setAvatarUrl] = useState<string>("");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await settingsService.getSettings();
//         const p = res.data.profile as any;

//         if (p) {
//           setName(p.name ?? user?.name ?? "");
//           setPhone(p.phone ?? "");
//           setAvatarUrl(p.avatar ?? "");
//         }
//       } catch (err) {
//         console.error("Error loading settings:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [user]);

//   useEffect(() => {
//     setName(user?.name || "");
//   }, [user]);

//   const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const url = URL.createObjectURL(file);
//     setAvatarUrl(url);
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setSaving(true);
//     setError(null);
//     setSuccess(null);

//     try {
//       await settingsService.updateProfile({ name, phone, avatarUrl });
//       await refreshUser();
//       setSuccess("Profile updated successfully.");
//     } catch (err: any) {
//       console.error("Error updating profile:", err);
//       setError(err?.response?.data?.message || "Failed to update profile.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <Loader />;

//   return (
//     <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl">
//       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
//         Profile Settings
//       </h2>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Avatar editable */}
//         <div className="flex items-center gap-4">
//           <div className="w-16 h-16 rounded-full bg-slate-600 overflow-hidden flex items-center justify-center">
//             {avatarUrl ? (
//               <img
//                 src={avatarUrl}
//                 alt="Avatar"
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <span className="text-sm text-white">No Avatar</span>
//             )}
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
//               Avatar
//             </label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleAvatarChange}
//               className="text-sm text-gray-700 dark:text-gray-200"
//             />
//             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//               Upload a new profile picture.
//             </p>
//           </div>
//         </div>

//         {/* Name editable */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Name
//           </label>
//           <input
//             type="text"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
//           />
//         </div>

//         {/* Phone editable */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Phone Number
//           </label>
//           <input
//             type="tel"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
//             placeholder="Enter phone number"
//           />
//         </div>

//         {/* Email read-only */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Email
//           </label>
//           <input
//             type="email"
//             value={user?.email || ""}
//             disabled
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
//           />
//         </div>

//         {/* Role read-only */}
//         <div>
//           <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
//             Role
//           </label>
//           <input
//             type="text"
//             value={user?.role || ""}
//             disabled
//             className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
//           />
//         </div>

//         {error && <p className="text-sm text-red-500">{error}</p>}
//         {success && <p className="text-sm text-green-500">{success}</p>}

//         <button
//           type="submit"
//           disabled={saving}
//           className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-blue-400"
//         >
//           {saving ? "Saving..." : "Save Changes"}
//         </button>
//       </form>
//     </div>
//   );
// }



















// src/components/Settings/ProfileSettings.tsx
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { settingsService } from "../../services/settings.service";
import Loader from "../common/Loader";

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsService.getSettings();
        const p = res.data.profile as any;

        if (p) {
          setName(p.name ?? user?.name ?? "");
          setPhone(p.phone ?? "");
          setAvatarUrl(p.avatar ?? "");
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    // For real upload, send file to backend and store returned URL instead.
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await settingsService.updateProfile({ name, phone, avatarUrl });
      await refreshUser();
      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Profile Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar (editable) */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-600 overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm text-white">No Avatar</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Avatar
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="text-sm text-gray-700 dark:text-gray-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Upload a new profile picture.
            </p>
          </div>
        </div>

        {/* Name (editable) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Phone (editable) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="Enter phone number"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
          />
        </div>

        {/* Role (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Role
          </label>
          <input
            type="text"
            value={user?.role || ""}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-blue-400"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
