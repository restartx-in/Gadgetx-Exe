const {
  moveItemImage,
  deleteItemImageDirectory,
} = require('../../middlewares/upload')

class ItemService {
  constructor(itemRepository) {
    this.itemRepository = itemRepository
  }

  async create(itemData, db) {
    if (itemData.bar_code) {
      // Pass db
      const existingItem = await this.itemRepository.findByBarcode(
        db,
        itemData.bar_code,
        itemData.tenant_id
      )
      if (existingItem) {
        const error = new Error(
          `Barcode '${itemData.bar_code}' already exists.`
        )
        error.statusCode = 409
        throw error
      }
    }

    if (
      itemData.selling_price_with_tax !== undefined &&
      itemData.tax !== undefined
    ) {
      const sellingPriceWithTax = parseFloat(itemData.selling_price_with_tax)
      const taxPercentage = parseFloat(itemData.tax)

      if (!isNaN(sellingPriceWithTax) && !isNaN(taxPercentage)) {
        const sellingPrice = sellingPriceWithTax / (1 + taxPercentage / 100)
        itemData.selling_price = sellingPrice
      } else {
        const error = new Error(
          'Invalid number for selling_price_with_tax or tax.'
        )
        error.statusCode = 400
        throw error
      }
    }

    const imageFile = itemData.imageFile
    delete itemData.imageFile
    itemData.image = null

    // Pass db
    const newItem = await this.itemRepository.create(db, itemData)
    if (!newItem) {
      throw new Error('Failed to create item.')
    }

    if (imageFile) {
      let partialImagePath = await moveItemImage(
        imageFile,
        newItem.tenant_id,
        newItem.id
      )
      const relativeImagePath = `uploads/${partialImagePath}`.replace(
        /\\/g,
        '/'
      )
      console.log(
        'BACKEND: Saving this image path to the database -->',
        relativeImagePath
      )
      // Pass db
      await this.itemRepository.update(db, newItem.id, newItem.tenant_id, {
        image: relativeImagePath,
      })
    }

    // Pass db
    return this.getById(newItem.id, newItem.tenant_id, db)
  }

  async update(id, tenantId, itemData, db) {
    const readOnlyFields = [
      'party_name',
      'party_phone',
      'category_name',
      'brand_name',
      'unit_name',
      'unit_symbol',
      'created_at',
      'updated_at',
      'total_count',
      'done_by_name',
      'cost_center_name',
    ]
    readOnlyFields.forEach((field) => delete itemData[field])

    const needsRecalculation =
      itemData.selling_price_with_tax !== undefined ||
      itemData.tax !== undefined

    if (needsRecalculation) {
      // Pass db
      const currentItem = await this.itemRepository.getById(db, id, tenantId)
      if (!currentItem) {
        return null
      }

      const sellingPriceWithTax =
        itemData.selling_price_with_tax !== undefined
          ? parseFloat(itemData.selling_price_with_tax)
          : parseFloat(currentItem.selling_price_with_tax)

      const taxPercentage =
        itemData.tax !== undefined
          ? parseFloat(itemData.tax)
          : parseFloat(currentItem.tax)

      if (!isNaN(sellingPriceWithTax) && !isNaN(taxPercentage)) {
        const sellingPrice = sellingPriceWithTax / (1 + taxPercentage / 100)
        itemData.selling_price = sellingPrice
      }
    }

    const imageFile = itemData.imageFile
    delete itemData.imageFile

    if (imageFile) {
      await deleteItemImageDirectory(tenantId, id)
      let partialImagePath = await moveItemImage(imageFile, tenantId, id)
      const relativeImagePath = `uploads/${partialImagePath}`.replace(
        /\\/g,
        '/'
      )
      itemData.image = relativeImagePath
    } else if ('image' in itemData && !itemData.image) {
      await deleteItemImageDirectory(tenantId, id)
      itemData.image = null
    }

    // Pass db
    const updatedItem = await this.itemRepository.update(db, id, tenantId, itemData)
    if (!updatedItem) {
      return null
    }

    // Pass db
    return this.getById(updatedItem.id, tenantId, db)
  }

  async delete(id, tenantId, db) {
    // Pass db
    const result = await this.itemRepository.delete(db, id, tenantId)
    if (result) {
      await deleteItemImageDirectory(tenantId, id)
    }
    return result
  }

  async getById(id, tenantId, db) {
    // Pass db
    return await this.itemRepository.getById(db, id, tenantId)
  }

  async getAll(tenantId, filters, db) {
    // Pass db
    return await this.itemRepository.getAllByTenantId(db, tenantId, filters)
  }

  async getPaginatedByTenantId(tenantId, filters, db) {
    // Pass db
    const { items, totalCount } = await this.itemRepository.getPaginatedTenantId(
      db,
      tenantId,
      filters
    )
    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0
    return {
      data: items,
      count: totalCount,
      page_count,
    }
  }
}

module.exports = ItemService