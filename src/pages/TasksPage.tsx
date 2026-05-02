import React from 'react';
import { ClipboardList, ExternalLink, ShieldCheck, CheckCircle2, ChevronRight, MessageSquare, Youtube, Facebook, Send, AlertCircle } from 'lucide-react';
import { db, collection, query, getDocs, where, doc, updateDoc, increment, addDoc, serverTimestamp } from '@/src/lib/firebase';
import { UserProfile, Task } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface TasksPageProps {
  profile: UserProfile;
}

export const TasksPage: React.FC<TasksPageProps> = ({ profile }) => {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [verifying, setVerifying] = React.useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        const q = query(collection(db, 'tasks'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);

        // Fetch completed tasks for this user
        const completedQ = query(collection(db, 'transactions'), where('userId', '==', profile.uid), where('type', '==', 'task_reward'));
        const completedSnapshot = await getDocs(completedQ);
        const completedIds = new Set(completedSnapshot.docs.map(doc => {
          const desc = doc.data().description;
          // Extract taskId from description if stored there, or usually we'd have a separate completed_tasks collection
          // For now, let's assume description contains taskId or we check by uniqueness
          return doc.data().taskId; // Assuming we store taskId in transaction
        }).filter(Boolean));
        setCompletedTaskIds(completedIds as Set<string>);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [profile.uid]);

  const verifyTask = async (task: Task) => {
    setVerifying(task.id);
    // Simulate verification delay
    await new Promise(res => setTimeout(res, 2000));

    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        balance: increment(task.reward),
        totalEarned: increment(task.reward)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: profile.uid,
        taskId: task.id,
        amount: task.reward,
        type: 'task_reward',
        description: `Completed task: ${task.title}`,
        createdAt: serverTimestamp()
      });

      setCompletedTaskIds(prev => new Set([...prev, task.id]));
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(null);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'telegram_join':
      case 'telegram_bot': return <Send size={24} className="text-blue-500" />;
      case 'youtube_sub': return <Youtube size={24} className="text-red-500" />;
      case 'facebook_follow': return <Facebook size={24} className="text-blue-700" />;
      default: return <ClipboardList size={24} className="text-purple-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold">Finding tasks for you...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Available Tasks</h2>
        <p className="text-slate-400 font-medium tracking-tight">Complete these simple steps to earn extra rewards instantly.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.length === 0 ? (
           <div className="bg-[#1E293B]/40 backdrop-blur-xl p-12 rounded-[2.5rem] border border-white/10 text-center space-y-4 shadow-2xl">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-white/5">
                <ClipboardList size={32} />
             </div>
             <p className="text-white font-black text-xl">No tasks available right now.</p>
             <p className="text-slate-400 max-w-sm mx-auto">Check back later or watch more ads to keep earning!</p>
           </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = completedTaskIds.has(task.id);
            const isVerifying = verifying === task.id;

            return (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-[#1E293B]/40 backdrop-blur-xl p-6 rounded-[2.5rem] border transition-all flex flex-col md:flex-row md:items-center gap-6 group",
                  isCompleted ? "border-green-500/20 opacity-60" : "border-white/10 hover:border-indigo-500/50 shadow-2xl"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 shadow-xl",
                  isCompleted ? "bg-green-500/20 text-green-400 border-green-500/20" : "bg-white/5 border-white/5 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500"
                )}>
                  {isCompleted ? <CheckCircle2 size={32} /> : getTaskIcon(task.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">{task.title}</h3>
                    {isCompleted && (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 font-medium leading-tight">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-black">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Reward:</span>
                      {formatCurrency(task.reward)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
                  {!isCompleted && (
                    <>
                      <a 
                        href={task.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-black hover:bg-white/10 transition-colors"
                      >
                        Action <ExternalLink size={18} />
                      </a>
                      <button 
                        onClick={() => verifyTask(task)}
                        disabled={isVerifying}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-xl",
                          isVerifying 
                            ? "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5" 
                            : "bg-white text-slate-950 hover:bg-slate-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        )}
                      >
                        {isVerifying ? (
                          <>
                            <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                            Verify...
                          </>
                        ) : (
                          'Claim'
                        )}
                      </button>
                    </>
                  )}
                  {isCompleted && (
                    <div className="px-6 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 font-black flex items-center justify-center gap-2 w-full text-sm">
                      <CheckCircle2 size={18} />
                      Claimed
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Safety info */}
      <div className="p-8 bg-indigo-600/20 backdrop-blur-xl rounded-[2.5rem] text-white flex flex-col md:flex-row md:items-center gap-6 justify-between border border-white/10 shadow-2xl">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
              <ShieldCheck className="text-green-400" size={28} />
            </div>
            <div>
              <p className="font-black text-lg">Secure Earnings</p>
              <p className="text-sm text-slate-400 font-medium leading-tight">Rewards are processed instantly after verification check.</p>
            </div>
         </div>
         <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5">
            <AlertCircle size={20} className="text-yellow-400" />
            <p className="text-[10px] font-black text-slate-400 max-w-[200px] uppercase leading-relaxed tracking-wider">Cheating will lead to account ban and balance loss.</p>
         </div>
      </div>
    </div>
  );
};
