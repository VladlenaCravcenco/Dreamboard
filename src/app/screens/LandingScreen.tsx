import { Link } from 'react-router';
import { Spark, LayoutGrid, Check, Gift, Heart, Lock } from '../components/PixelIcons';
import { siteDescription } from '../lib/siteMeta.mjs';

// Rendered for guests on "/" and prerendered into dist/index.html (scripts/prerender.mjs),
// so it must not use auth/dream contexts or browser-only APIs during render.

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

const structuredData = JSON.stringify([
  { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Dreamboard', applicationCategory: 'LifestyleApplication', operatingSystem: 'Web', inLanguage: 'ru', description: siteDescription },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) },
]).replace(/</g, '\\u003c');

export default function LandingScreen() {
  return <div className="landing">
    <header className="landing-header">
      <Link to="/" className="brand"><span className="brand-symbol"><Spark size={24}/></span>Dreamboard</Link>
      <nav aria-label="Аккаунт" className="landing-header-actions">
        <Link to="/auth" className="landing-link">Войти</Link>
        <Link to="/auth?mode=signup" className="landing-cta landing-cta-small">Начать</Link>
      </nav>
    </header>

    <main>
      <section className="landing-hero" aria-labelledby="landing-title">
        <div>
          <p className="eyebrow">Мечты · желания · подарки</p>
          <h1 id="landing-title" className="board-heading">Список желаний, который помогает мечтам сбываться</h1>
          <p className="landing-lead">Сохраняйте мечты, делайте к ним маленькие шаги и делитесь вишлистом с друзьями — они тайно выберут подарок, а сюрприз сохранится.</p>
          <div className="landing-actions">
            <Link to="/auth?mode=signup" className="landing-cta">Создать свой Dreamboard</Link>
            <Link to="/auth" className="landing-secondary">У меня уже есть аккаунт</Link>
          </div>
        </div>
        <div className="landing-preview" aria-hidden="true">
          {demoDreams.map(dream => <div key={dream.title} className="landing-preview-card">
            <div className="landing-preview-cover"><Spark size={40}/></div>
            <div>
              <p className="eyebrow">{dream.category}</p>
              <p className="landing-preview-title">{dream.title}</p>
              <p className="landing-preview-steps">{dream.done} / {dream.total} шагов</p>
              <div className="landing-preview-bar"><span style={{ width: `${Math.round(dream.done / dream.total * 100)}%` }}/></div>
            </div>
          </div>)}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-features">
        <p className="eyebrow">Возможности</p>
        <h2 id="landing-features">Всё, что нужно для мечт и подарков</h2>
        <div className="landing-grid">
          {features.map(({ Icon, title, text }) => <article key={title} className="landing-card">
            <Icon size={28}/>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>)}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-steps">
        <p className="eyebrow">Как это работает</p>
        <h2 id="landing-steps">Три шага от желания к воспоминанию</h2>
        <ol className="landing-steps">
          {steps.map((step, index) => <li key={step.title}>
            <span className="landing-step-number">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>)}
        </ol>
      </section>

      <section className="landing-section landing-privacy" aria-labelledby="landing-privacy">
        <Lock size={32}/>
        <div>
          <h2 id="landing-privacy">Личное остаётся личным</h2>
          <p>Ваша доска видна только вам. Делиться или нет — решаете вы, и доступ по ссылке можно отозвать в любой момент.</p>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-faq">
        <p className="eyebrow">Вопросы</p>
        <h2 id="landing-faq">Частые вопросы</h2>
        <div className="landing-faq">
          {faq.map(item => <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>)}
        </div>
      </section>

      <section className="landing-final" aria-labelledby="landing-final">
        <h2 id="landing-final">С чего начнётся ваша история?</h2>
        <p>Добавьте то, чего давно хочется. Большой план пока не нужен.</p>
        <Link to="/auth?mode=signup" className="landing-cta">Создать свой Dreamboard</Link>
      </section>
    </main>

    <footer className="landing-footer">
      <span>© Dreamboard</span>
      <nav aria-label="Ссылки в подвале"><Link to="/auth">Войти</Link><Link to="/auth?mode=signup">Регистрация</Link></nav>
    </footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }}/>
  </div>;
}
