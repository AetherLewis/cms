import { formatCurrency } from '../utils/format'

export function InvoiceItemRow({ item, index, onUpdate, onRemove }: any) {
  return (
    <div className="flex items-center gap-3 bg-star-50 rounded-lg p-3 border border-star-200">
      <div className="flex-1">
        <input
          className="w-full bg-white border border-star-200 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-star-600 focus:outline-none"
          placeholder="Service / Item description"
          value={item.description}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
        />
      </div>
      <div className="w-24">
        <input
          type="number"
          min={0}
          step={0.1}
          className="w-full bg-white border border-star-200 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-star-600 focus:outline-none"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', Number(e.target.value))}
        />
      </div>
      <div className="w-32">
        <input
          type="number"
          min={0}
          step={0.01}
          className="w-full bg-white border border-star-200 rounded px-2 py-1.5 text-sm text-right focus:ring-2 focus:ring-star-600 focus:outline-none"
          value={item.unit_price}
          onChange={(e) => onUpdate(index, 'unit_price', Number(e.target.value))}
        />
      </div>
      <div className="w-24 text-sm font-medium text-star-900 text-right">
        {formatCurrency(item.quantity * item.unit_price)}
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-red-400 hover:text-red-600 p-1"
        aria-label="Remove item"
        title="Remove item"
      >
        ×
      </button>
    </div>
  )
}
