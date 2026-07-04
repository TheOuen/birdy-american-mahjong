import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import type { Product } from '@/lib/shop/types'
import { saveProduct, createProduct } from '../actions'

export const metadata = { title: 'Products - Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const { rows: products, offline } = await adminQuery<Product>((sb) =>
    sb.from('products').select('*').order('type').order('price_pence', { ascending: false })
  )

  const lessons = products.filter((p) => p.type === 'lesson')
  const physical = products.filter((p) => p.type === 'physical')

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Products &amp; lessons
      </h1>

      {offline && <OfflineBanner thing="the catalogue" />}

      {[
        { label: 'Lessons', items: lessons },
        { label: 'Equipment', items: physical },
      ].map(
        (group) =>
          group.items.length > 0 && (
            <section key={group.label} className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{group.label}</h2>
              {group.items.map((p) => (
                <form
                  key={p.id}
                  action={saveProduct}
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 grid grid-cols-1 md:grid-cols-[2fr_1fr_auto_auto] gap-4 items-end"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
                      Name
                      <input name="name" defaultValue={p.name} required className="input-elegant" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
                      Description
                      <textarea name="description" defaultValue={p.description} rows={2} className="input-elegant" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
                    Price (£)
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={(p.price_pence / 100).toFixed(2)}
                      required
                      className="input-elegant"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-base font-medium text-[var(--text-primary)] pb-2">
                    <input type="checkbox" name="active" defaultChecked={p.active} className="w-5 h-5" />
                    In shop
                  </label>
                  <button className="btn-primary text-base px-6">Save</button>
                </form>
              ))}
            </section>
          )
      )}

      {/* Add product */}
      <form
        action={createProduct}
        className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-4 max-w-2xl"
      >
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Add a product</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
            Name
            <input name="name" required className="input-elegant" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
            Slug (web address)
            <input name="slug" required pattern="[a-z0-9-]+" className="input-elegant" placeholder="mahjong-tile-set" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
            Type
            <select name="type" className="input-elegant">
              <option value="physical">Equipment (shipped)</option>
              <option value="lesson">Lesson (Andrew schedules)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
            Price (£)
            <input name="price" type="number" step="0.01" min="0.01" required className="input-elegant" />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
          Description
          <textarea name="description" rows={3} className="input-elegant" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
          Image path <span className="font-normal">(optional - a file under /public, e.g. /aml/nmjl-card-2026.png)</span>
          <input name="image" className="input-elegant" placeholder="/aml/tiles-2.png" />
        </label>
        <button className="btn-berry text-base self-start px-8">Add to catalogue</button>
      </form>
    </div>
  )
}
