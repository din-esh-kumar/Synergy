// src/pages/chat/MessagesPage.tsx
import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from '../../components/Chat/ChatWindow';
import ChatInput from '../../components/Chat/ChatInput';
import { TeamService } from '../../services/team.service';
import { userService } from '../../services/user.service';

interface Team {
  id: string;
  name: string;
}

interface DirectUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { loadMessages } = useChat();

  const [activeTeamId, setActiveTeamId] = useState<string | undefined>();
  const [activeUserId, setActiveUserId] = useState<string | undefined>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<DirectUser[]>([]);

  // Load sidebar: teams + users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const isAdminOrManager =
          user?.role === 'ADMIN' || user?.role === 'MANAGER';

        const [teamList, usersList] = await Promise.all([
          isAdminOrManager
            ? TeamService.getTeams()
            : TeamService.getMyTeams(), // ✅ employees: only their teams
          isAdminOrManager
            ? userService.getAllUsers()
            : userService.getDmUsers(),
        ]);

        setTeams(
          (teamList || []).map((t: any) => ({
            id: t._id ?? t.id,
            name: t.name,
          })),
        );

        setUsers(
          (usersList || [])
            .filter((u: any) => (u._id ?? u.id) !== user?._id)
            .map((u: any) => ({
              id: u._id ?? u.id,
              name: u.name,
              avatarUrl: u.avatarUrl,
            })),
        );
      } catch (err) {
        console.error('Error loading teams/users for messages', err);
      }
    };

    fetchData();
  }, [user?._id, user?.role]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeTeamId) {
      loadMessages({ teamId: activeTeamId });
    } else if (activeUserId) {
      loadMessages({ toUserId: activeUserId });
    }
  }, [activeTeamId, activeUserId, loadMessages]);

  const handleSelectTeam = (teamId: string) => {
    setActiveTeamId(teamId);
    setActiveUserId(undefined);
  };

  const handleSelectUser = (userId: string) => {
    setActiveUserId(userId);
    setActiveTeamId(undefined);
  };

  const roomId = activeTeamId || activeUserId || 'default-room';
  const currentTeamName =
    teams.find((t) => t.id === activeTeamId)?.name || 'Select a team';
  const currentUserName =
    users.find((u) => u.id === activeUserId)?.name || 'Select a user';

  return (
    <div className="h-full flex dark:bg-slate-950 bg-white dark:text-slate-50 text-slate-900">
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Team channels and direct messages in one place
            </p>
          </div>
        </div>

        {/* Layout */}
        <div className="grid lg:grid-cols-[260px,minmax(0,1fr)] gap-6 h-[calc(100vh-140px)]">
          {/* Left: channels + DMs */}
          <aside className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col shadow-sm">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search…"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase mb-2">
                  Channels
                </p>
                <div className="space-y-1">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleSelectTeam(team.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        activeTeamId === team.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-blue-500 dark:text-blue-300 text-base">
                        #
                      </span>
                      <span className="truncate">{team.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase mb-2">
                  Direct Messages
                </p>
                <div className="space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        activeUserId === u.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Right: chat card */}
          <div className="flex flex-col bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white">
                  {activeTeamId ? '#' : 'DM'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    {activeTeamId ? currentTeamName : currentUserName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active now
                  </p>
                </div>
              </div>
            </div>

            {/* Chat content + input */}
            <ChatWindow
              teamId={activeTeamId}
              toUserId={activeUserId}
              roomId={roomId}
            />

            {activeTeamId || activeUserId ? (
              <ChatInput
                teamId={activeTeamId}
                toUserId={activeUserId}
                roomId={roomId}
              />
            ) : (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                Select a team or user to start chatting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
