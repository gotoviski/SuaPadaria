import Icon from '../Icons/Icons';
import styles from './PagePlaceholder.module.css';

export default function PagePlaceholder({ title, description, endpoint, icon = 'package' }) {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <Icon name={icon} size={28} strokeWidth={1.6} />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {endpoint && <code className={styles.endpoint}>{endpoint}</code>}
      </div>
    </section>
  );
}
