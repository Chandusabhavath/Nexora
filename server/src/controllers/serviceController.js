import { dataStore } from '../models/dataStore.js';

export const getServices = (req, res) => {
  try {
    const { category, search, maxPrice, providerId } = req.query;
    let services = dataStore.getServices({ category, search, maxPrice });

    if (providerId) {
      services = services.filter((s) => s.providerId.toString() === providerId.toString());
    }

    res.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve services.' });
  }
};

export const getServiceById = (req, res) => {
  try {
    const service = dataStore.getServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const provider = dataStore.getProviderById(service.providerId);
    const reviews = dataStore.getReviewsByProvider(service.providerId);

    res.json({
      success: true,
      service,
      provider,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve service details.' });
  }
};

export const createService = (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(403).json({ success: false, message: 'Only registered providers can create services.' });
    }

    const { title, category, description, priceType, price, durationMinutes, includedItems, excludedItems, images, tags } = req.body;

    if (!title || !category || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, description, and price are required.',
      });
    }

    const newService = dataStore.addService({
      providerId: provider._id,
      provider,
      title: title.trim(),
      category,
      description: description.trim(),
      priceType: priceType || 'hourly',
      price: Number(price),
      durationMinutes: Number(durationMinutes) || 60,
      includedItems: Array.isArray(includedItems) ? includedItems : (includedItems ? includedItems.split(',') : []),
      excludedItems: Array.isArray(excludedItems) ? excludedItems : (excludedItems ? excludedItems.split(',') : []),
      images: images || ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      tags: tags || [category.toLowerCase()],
      createdAt: new Date().toISOString(),
    });

    dataStore.addAuditLog({
      action: 'SERVICE_CREATED',
      performedBy: req.user.id,
      targetType: 'Service',
      targetId: newService._id,
      details: { title: newService.title, category: newService.category },
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      service: newService,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create service.', error: error.message });
  }
};

export const updateService = (req, res) => {
  try {
    const service = dataStore.getServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // Check ownership unless admin
    if (req.user.role !== 'admin') {
      const provider = dataStore.getProviderByUserId(req.user.id);
      if (!provider || service.providerId.toString() !== provider._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this service.' });
      }
    }

    const updates = req.body;
    const updated = dataStore.updateService(service._id, updates);

    res.json({
      success: true,
      message: 'Service updated successfully.',
      service: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update service.' });
  }
};

export const deleteService = (req, res) => {
  try {
    const service = dataStore.getServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    if (req.user.role !== 'admin') {
      const provider = dataStore.getProviderByUserId(req.user.id);
      if (!provider || service.providerId.toString() !== provider._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this service.' });
      }
    }

    dataStore.deleteService(service._id);

    res.json({
      success: true,
      message: 'Service deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete service.' });
  }
};
