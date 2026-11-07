import Icon from '../Icons/Icons';

export default function Modal({ title, icon, onClose, children, footer, wide }) {
  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className={`modal-dialog modal-dialog-centered ${wide ? 'modal-lg' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2">
                {icon && <Icon name={icon} size={18} />}
                {title}
              </h5>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
