import FriendWishCard from '../components/FriendWishCard';
import FriendWishTile from '../components/FriendWishTile';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { motion, useReducedMotion } from 'motion/react';
import { occasionText } from '../lib/giftDetails';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { wishes, invitePath, namedInvitePath, type Board } from '../lib/wishes';
import { primaryClass } from '../components/AddDreamModal';
import { Spark } from '../components/PixelIcons';
import { toast } from 'sonner';

export default function FriendBoardScreen(){
  const {token,id,slug}=useParams();const {user,loading:authLoading}=useAuth();const navigate=useNavigate();
  const [board,setBoard]=useState<Board|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[onlyMarked,setOnlyMarked]=useState(false),[remove,setRemove]=useState(false),[openId,setOpenId]=useState<string|null>(null);const reduceMotion=useReducedMotion();
  useEffect(()=>{
    if(!user){setBoard(null);return;}
    let active=true, running=false;
    async function load(){if(running)return;running=true;try{const b=await wishes<Board>(slug?'wish_board_named':'wish_board',slug?{p_slug:slug}:token?{p_token:token}:{p_link_id:id});if(active){setBoard(b);setError('');}}catch(e){if(active){setBoard(null);setError((e as Error).message);}}finally{running=false;if(active)setLoading(false);}}
    setBoard(null);setLoading(true);void load();
    const refresh=()=>{if(document.visibilityState==='visible')void load();};
    const timer=window.setInterval(refresh,15000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[token,id,slug,user?.id]);
  if(authLoading)return <main className="p-8" role="status">Загружаем…</main>;
  if(!user)return <main className="max-w-md mx-auto px-6 py-16 space-y-6"><Spark size={40}/><h1 className="text-3xl">Вам поделились желаниями</h1><p className="text-sm text-muted-foreground">Войдите, чтобы сохранить список друга и тайно выбрать подарок. Ваши отметки увидите только вы.</p><Link to="/auth" className={`${primaryClass} inline-block`} onClick={()=>{if(token||slug)sessionStorage.setItem('dreamboard-pending-invite',slug?namedInvitePath(slug):invitePath(token!));}}>Войти и открыть список</Link></main>;
  return <main className="max-w-4xl mx-auto px-4 py-6 space-y-6"><Link to="/friends" className="text-sm text-muted-foreground">← Друзья</Link>
    {loading?<p role="status">Загружаем желания…</p>:error?<section role="alert" className="border border-border p-6 rounded-2xl space-y-4"><p>{error}</p><p className="text-sm text-muted-foreground">Попросите друга проверить доступ или прислать новую ссылку.</p>{id&&<button className={primaryClass} onClick={()=>window.location.reload()}>Повторить</button>}</section>:board&&<>
      <header className="space-y-3"><h1 className="board-heading break-words">{board.name}</h1><p className="text-sm text-muted-foreground">Список обновляется автоматически. Ваши отметки — только для вас.</p></header>
      {board.is_owner?<p className="rounded-xl border border-border p-4 text-sm">Так друзья видят ваш список. Их отметки здесь не отображаются. <Link className="underline" to="/share">Настроить доступ</Link></p>:!board.saved?<button disabled={busy} className={primaryClass} onClick={async()=>{if(!token&&!slug)return;setBusy(true);try{const linkId=await wishes<string>(slug?'wish_save_friend_named':'wish_save_friend',slug?{p_slug:slug}:{p_token:token});navigate(`/friends/${linkId}`,{replace:true});toast.success('Друг сохранён');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}>Добавить друга</button>:<div className="flex flex-wrap gap-3"><button className={primaryClass} aria-pressed={onlyMarked} onClick={()=>setOnlyMarked(!onlyMarked)}>{onlyMarked?'Показать все желания':'Мои идеи подарков'}</button><Link className="border border-border rounded-xl px-4 py-3 text-sm" to="/share">Поделиться своими желаниями</Link></div>}
      {occasionText(board.preferences)&&<p className="text-sm">{occasionText(board.preferences)}</p>}
      {!board.is_owner&&<p className="text-xs text-muted-foreground">Нажмите «Куплю» — подарок закрепится за вами и встанет в начало списка. Другие друзья увидят, что он занят, а {board.name} — нет. Нажмите на желание, чтобы посмотреть подробности.</p>}
      {(()=>{const reload=async()=>setBoard(await wishes<Board>(slug?'wish_board_named':'wish_board',slug?{p_slug:slug}:token?{p_token:token}:{p_link_id:id}));
        // Gifts this friend will buy come first, free wishes next, gifts taken by others last.
        const rank=(d:Board['dreams'][number])=>d.reservation==='mine'?0:d.reservation==='other'?2:1;
        const list=board.dreams.filter(d=>!onlyMarked||d.marked||d.reservation==='mine').sort((a,b)=>rank(a)-rank(b));
        const open=board.dreams.find(d=>d.id===openId);
        return <>
          <div className="friend-board-grid">{list.map(d=><motion.div key={d.id} layout={!reduceMotion} transition={{duration:reduceMotion?0:.45,ease:[.2,.7,.2,1]}} className="min-w-0"><FriendWishTile dream={d} linkId={board.id} owner={board.is_owner} saved={board.saved} onOpen={()=>setOpenId(d.id)} refresh={reload}/></motion.div>)}</div>
          <Dialog open={!!open} onOpenChange={o=>{if(!o)setOpenId(null);}}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg p-0">{open&&<><DialogTitle className="sr-only">{open.title}</DialogTitle><DialogDescription className="sr-only">Подробности желания</DialogDescription><FriendWishCard dream={open} linkId={board.id} owner={board.is_owner} saved={board.saved} refresh={reload}/></>}</DialogContent></Dialog>
        </>;})()}
      {board.dreams.filter(d=>!onlyMarked||d.marked||d.reservation==='mine').length===0&&<p className="border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">{onlyMarked?'Пока нет выбранных подарков.': 'Пока нет доступных желаний. Новые появятся здесь, когда друг ими поделится.'}</p>}
      {!board.saved&&!board.is_owner&&<p className="text-sm">Сохраните друга, чтобы отмечать подарки.</p>}
      {board.saved&&<div className="text-sm">{remove?<><p className="mb-3">Убрать друга, ваши заметки и брони? Можно снова добавить его по ссылке.</p><button disabled={busy} className={primaryClass} onClick={async()=>{setBusy(true);try{await wishes('wish_remove_friend',{p_link_id:board.id});navigate('/friends');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}>Убрать</button><button className="ml-4" onClick={()=>setRemove(false)}>Отмена</button></>:<button className="underline text-muted-foreground" onClick={()=>setRemove(true)}>Убрать из друзей</button>}</div>}
    </>}
  </main>;
}
