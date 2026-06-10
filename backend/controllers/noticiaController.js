import NoticiaActualidad from '../models/NoticiaActualidad.js';

// Obtener todas las noticias (Público)
export const getAllNoticias = async (req, res) => {
  const { search, limit = 10, page = 1 } = req.query; // Soporta filtro de búsqueda y paginación
  try {
    let query = {};
    if (search) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query = {
        $or: [
          { titulo: { $regex: escapedSearch, $options: 'i' } },
          { cuerpo_html: { $regex: escapedSearch, $options: 'i' } },
          { tags: { $regex: escapedSearch, $options: 'i' } }
        ]
      };
    }
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);

    const noticias = await NoticiaActualidad.find(query)
      .sort({ fecha: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    return res.json(noticias);
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de noticias.' });
  }
};

// Obtener noticia por ID (Público)
export const getNoticiaById = async (req, res) => {
  const { id } = req.params;
  try {
    const noticia = await NoticiaActualidad.findById(id);
    if (!noticia) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }
    return res.json(noticia);
  } catch (error) {
    console.error('Error al obtener noticia:', error);
    return res.status(500).json({ error: 'Error al obtener los detalles de la noticia.' });
  }
};

// Crear noticia (Solo Admin)
export const createNoticia = async (req, res) => {
  const { titulo, cuerpo_html, multimedia, tags, fecha } = req.body;

  try {
    const nuevaNoticia = await NoticiaActualidad.create({
      titulo,
      cuerpo_html,
      multimedia: multimedia || [],
      tags: tags || [],
      fecha: fecha || Date.now()
    });
    return res.status(201).json(nuevaNoticia);
  } catch (error) {
    console.error('Error al crear noticia:', error);
    return res.status(500).json({ error: 'Error al registrar la noticia.' });
  }
};

// Actualizar noticia (Solo Admin)
export const updateNoticia = async (req, res) => {
  const { id } = req.params;
  const { titulo, cuerpo_html, multimedia, tags, fecha } = req.body;

  try {
    const noticia = await NoticiaActualidad.findById(id);
    if (!noticia) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    if (titulo !== undefined) noticia.titulo = titulo;
    if (cuerpo_html !== undefined) noticia.cuerpo_html = cuerpo_html;
    if (multimedia !== undefined) noticia.multimedia = multimedia;
    if (tags !== undefined) noticia.tags = tags;
    if (fecha !== undefined) noticia.fecha = fecha;

    await noticia.save();
    return res.json({ message: 'Noticia actualizada correctamente.', noticia });
  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    return res.status(500).json({ error: 'Error al actualizar la noticia.' });
  }
};

// Eliminar noticia (Solo Admin)
export const deleteNoticia = async (req, res) => {
  const { id } = req.params;
  try {
    const noticia = await NoticiaActualidad.findById(id);
    if (!noticia) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }
    await noticia.deleteOne();
    return res.json({ message: 'Noticia eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    return res.status(500).json({ error: 'Error al eliminar la noticia.' });
  }
};
