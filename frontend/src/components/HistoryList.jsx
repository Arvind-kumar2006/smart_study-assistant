import PropTypes from 'prop-types';

export default function HistoryList({ items, onSelect, onClear }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="history">
      <div className="history-header">
        <h3>Recent Topics</h3>
        <button type="button" onClick={onClear} className="link-button">
          Clear
        </button>
      </div>
      <div className="history-items">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className="history-item"
            onClick={() => onSelect(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

HistoryList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

HistoryList.defaultProps = {
  items: [],
};
