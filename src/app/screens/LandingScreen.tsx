import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Spark, LayoutGrid, Check, Gift, Heart, Lock } from '../components/PixelIcons';
import { siteDescription } from '../lib/siteMeta.mjs';
import { AuthPanel, type Mode } from './AuthScreen';

// Rendered for guests on "/" and prerendered into dist/index.html (scripts/prerender.mjs),
// so it must not use auth/dream contexts or browser-only APIs during render.
// Without JavaScript (or with reduced motion) it is a normal scrolling page; the effect
// below turns the sections into full-screen slides that stack over each other on scroll.

const features = [
  { Icon: LayoutGrid, title: 'Доска мечт', text: 'Путешествия, вещи, впечатления, учёба и забота о себе — всё, чего хочется, в одном месте. С фото, описанием и категориями.' },
  { Icon: Check, title: 'Маленькие шаги', text: 'Разбейте большую мечту на шаги и отмечайте прогресс. Можно указать бюджет и записывать, сколько уже накоплено.' },
  { Icon: Gift, title: 'Вишлист для друзей', text: 'Поделитесь списком желаний по ссылке. Друзья бронируют подарки, чтобы они не повторялись, а вы не узнаете, кто что выбрал.' },
  { Icon: Heart, title: 'Воспоминания', text: 'Когда мечта сбылась, отметьте её и добавьте фото. Так собирается коллекция того, что уже случилось.' },
];

const steps = [
  { title: 'Добавьте мечту', text: 'Достаточно названия. Фото, описание и бюджет — когда захочется. Можно вставить ссылку на товар.' },
  { title: 'Делайте маленькие шаги', text: 'Dreamboard подскажет следующий шаг и покажет, сколько уже пройдено.' },
  { title: 'Поделитесь с близкими', text: 'Отправьте ссылку на список желаний — к празднику подарят именно то, о чём вы мечтаете.' },
];

const faq = [
  { q: 'Кто видит мои желания?', a: 'Только вы. Если включить ссылку, друзья увидят лишь те желания, которые вы выбрали. Заметки, шаги и накопления остаются личными.' },
  { q: 'Узнаю ли я, какой подарок выбрал друг?', a: 'Нет. Брони и идеи подарков видят только ваши друзья, поэтому сюрприз сохранится.' },
  { q: 'Можно добавить желание по ссылке на товар?', a: 'Да. Вставьте ссылку из магазина — Dreamboard попробует подставить название и фото товара.' },
  { q: 'Работает ли Dreamboard на телефоне?', a: 'Да. Он открывается в браузере, а ещё его можно добавить на главный экран и пользоваться как приложением.' },
];

const demoDreams = [
  { title: 'Неделя в Японии', category: 'Путешествия', done: 2, total: 5 },
  { title: 'Плёночный фотоаппарат', category: 'Вещи', done: 1, total: 2 },
  { title: 'Курс керамики', category: 'Развитие', done: 3, total: 4 },
];

const slides = [
  { id: 'start', label: 'Начало' },
  { id: 'features', label: 'Возможности' },
  { id: 'how', label: 'Как это работает' },
  { id: 'privacy', label: 'Приватность' },
  { id: 'faq', label: 'Вопросы' },
  { id: 'join', label: 'Начать' },
];

const structuredData = JSON.stringify([
  { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Dreamboard', applicationCategory: 'LifestyleApplication', operatingSystem: 'Web', inLanguage: 'ru', description: siteDescription },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) },
]).replace(/</g, '\\u003c');

const delay = (i: number) => ({ '--i': i }) as CSSProperties;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Quickly rewinds the page to the first slide, then calls done. */
function rewindToTop(done: () => void) {
  const start = window.scrollY;
  if (start < 4 || prefersReducedMotion()) { window.scrollTo(0, 0); done(); return; }
  const duration = Math.min(900, 350 + start / 12);
  const began = performance.now();
  const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = (now: number) => {
    const t = Math.min(1, (now - began) / duration);
    window.scrollTo(0, Math.round(start * (1 - ease(t))));
    if (t < 1) requestAnimationFrame(step); else done();
  };
  requestAnimationFrame(step);
}

/** Sticky full-screen slides: each next slide covers the previous one, which shrinks and dims. */
function useStackedSlides(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element || prefersReducedMotion()) return;
    const sections = Array.from(element.querySelectorAll<HTMLElement>('[data-slide]'));
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('[data-slide-link]'));
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      let active = 0;
      sections.forEach((section, index) => {
        const next = sections[index + 1];
        const nextTop = next ? next.getBoundingClientRect().top : height;
        const cover = Math.min(1, Math.max(0, (height - nextTop) / height));
        section.style.setProperty('--cover', cover.toFixed(3));
        if (section.getBoundingClientRect().top <= height * 0.5) active = index;
      });
      links.forEach((link, index) => index === active ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
    };
    // Slides taller than the screen stick by their bottom edge, so all their content stays reachable.
    const layout = () => {
      const height = window.innerHeight;
      sections.forEach(section => section.style.setProperty('--stick-top', `${Math.min(0, height - section.offsetHeight)}px`));
      update();
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(layout);
    sections.forEach(section => resize.observe(section));
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      reveal.unobserve(entry.target);
    }), { threshold: 0.15 });
    element.querySelectorAll('.reveal').forEach(item => reveal.observe(item));
    element.classList.add('is-stacked');
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', layout);
    layout();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      reveal.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', layout);
      element.classList.remove('is-stacked');
    };
  }, [root]);
}

export default function LandingScreen() {
  const root = useRef<HTMLDivElement>(null);
  const authBox = useRef<HTMLDivElement>(null);
  const [auth, setAuth] = useState<Mode | null>(null);
  useStackedSlides(root);
  useEffect(() => { if (auth) authBox.current?.focus({ preventScroll: true }); }, [auth]);
  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  // Sign-up / sign-in buttons rewind the slides to the first screen and open the form there.
  // The links still point to /auth, so they work without JavaScript.
  const openAuth = (mode: Mode) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    rewindToTop(() => setAuth(mode));
  };

  return <div className="landing" ref={root}>
    <nav className="landing-pager" aria-label="Разделы страницы">
      {slides.map(slide => <a key={slide.id} href={`#${slide.id}`} data-slide-link aria-label={slide.label} title={slide.label} onClick={event => goTo(event, slide.id)}/>)}
    </nav>

    <main>
      <span id="start" className="landing-anchor"/>
      <section className="landing-slide landing-slide-hero" data-slide aria-labelledby="landing-title">
        <div className="landing-slide-inner">
          <header className="landing-header">
            <Link to="/" className="brand"><span className="brand-symbol"><Spark size={24}/></span>Dreamboard</Link>
            <nav aria-label="Аккаунт" className="landing-header-actions">
              <Link to="/auth" className="landing-link" onClick={openAuth('signin')}>Войти</Link>
              <Link to="/auth?mode=signup" className="landing-cta landing-cta-small" onClick={openAuth('signup')}>Начать</Link>
            </nav>
          </header>
          <div className={`landing-hero ${auth ? 'is-auth' : ''}`}>
            <div>
              <p className="eyebrow">Мечты · желания · подарки</p>
              <h1 id="landing-title" className="board-heading">Список желаний, который помогает мечтам сбываться</h1>
              <p className="landing-lead">Сохраняйте мечты, делайте к ним маленькие шаги и делитесь вишлистом с друзьями — они тайно выберут подарок, а сюрприз сохранится.</p>
              <div className="landing-actions">
                <Link to="/auth?mode=signup" className="landing-cta" onClick={openAuth('signup')}>Создать свой Dreamboard</Link>
                <Link to="/auth" className="landing-secondary" onClick={openAuth('signin')}>У меня уже есть аккаунт</Link>
              </div>
            </div>
            {auth ? <div ref={authBox} tabIndex={-1} className="landing-auth" role="region" aria-label="Вход и регистрация">
              <AuthPanel key={auth} variant="inline" initialMode={auth} onClose={() => setAuth(null)}/>
            </div> : <div className="landing-preview" aria-hidden="true">
              {demoDreams.map(dream => <div key={dream.title} className="landing-preview-card">
                <div className="landing-preview-cover"><Spark size={40}/></div>
                <div>
                  <p className="eyebrow">{dream.category}</p>
                  <p className="landing-preview-title">{dream.title}</p>
                  <p className="landing-preview-steps">{dream.done} / {dream.total} шагов</p>
                  <div className="landing-preview-bar"><span style={{ width: `${Math.round(dream.done / dream.total * 100)}%` }}/></div>
                </div>
              </div>)}
            </div>}
          </div>
          <a href="#features" className="landing-scroll-hint" onClick={event => goTo(event, 'features')}>Листайте вниз <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <span id="features" className="landing-anchor"/>
      <section className="landing-slide" data-slide aria-labelledby="landing-features">
        <div className="landing-slide-inner">
          <p className="eyebrow reveal">Возможности</p>
          <h2 id="landing-features" className="reveal" style={delay(1)}>Всё, что нужно для мечт и подарков</h2>
          <div className="landing-grid">
            {features.map(({ Icon, title, text }, index) => <article key={title} className="landing-card reveal" style={delay(index + 2)}>
              <Icon size={28}/>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <span id="how" className="landing-anchor"/>
      <section className="landing-slide" data-slide aria-labelledby="landing-steps">
        <div className="landing-slide-inner">
          <p className="eyebrow reveal">Как это работает</p>
          <h2 id="landing-steps" className="reveal" style={delay(1)}>Три шага от желания к воспоминанию</h2>
          <ol className="landing-steps">
            {steps.map((step, index) => <li key={step.title} className="reveal" style={delay(index + 2)}>
              <span className="landing-step-number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>)}
          </ol>
        </div>
      </section>

      <span id="privacy" className="landing-anchor"/>
      <section className="landing-slide landing-slide-privacy" data-slide aria-labelledby="landing-privacy">
        <div className="landing-slide-inner landing-privacy">
          <span className="reveal"><Lock size={56}/></span>
          <h2 id="landing-privacy" className="reveal" style={delay(1)}>Личное остаётся личным</h2>
          <p className="reveal" style={delay(2)}>Ваша доска видна только вам. Делиться или нет — решаете вы, и доступ по ссылке можно отозвать в любой момент.</p>
        </div>
      </section>

      <span id="faq" className="landing-anchor"/>
      <section className="landing-slide" data-slide aria-labelledby="landing-faq">
        <div className="landing-slide-inner">
          <p className="eyebrow reveal">Вопросы</p>
          <h2 id="landing-faq" className="reveal" style={delay(1)}>Частые вопросы</h2>
          <div className="landing-faq">
            {faq.map((item, index) => <details key={item.q} className="reveal" style={delay(index + 2)}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>)}
          </div>
        </div>
      </section>

      <span id="join" className="landing-anchor"/>
      <section className="landing-slide landing-slide-final" data-slide aria-labelledby="landing-final">
        <div className="landing-slide-inner landing-final">
          <Spark size={48} className="reveal"/>
          <h2 id="landing-final" className="reveal" style={delay(1)}>С чего начнётся ваша история?</h2>
          <p className="reveal" style={delay(2)}>Добавьте то, чего давно хочется. Большой план пока не нужен.</p>
          <Link to="/auth?mode=signup" className="landing-cta reveal" style={delay(3)} onClick={openAuth('signup')}>Создать свой Dreamboard</Link>
        </div>
        <footer className="landing-footer">
          <span>© Dreamboard</span>
          <nav aria-label="Ссылки в подвале"><Link to="/auth" onClick={openAuth('signin')}>Войти</Link><Link to="/auth?mode=signup" onClick={openAuth('signup')}>Регистрация</Link></nav>
        </footer>
      </section>
    </main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }}/>
  </div>;
}
