

export const getPagination = (total_count, current_page ,limit ) => {
    

  const total_pages = Math.ceil(total_count / limit) 
    return  {
    total_pages,
    total_count,
    current_page,
    next_page: total_pages > current_page ?   current_page + 1 : null,
    has_next_page: total_pages > current_page ?    true : false,
    prev_page :current_page === 1 ? null : current_page - 1,
    has_prev_page: current_page === 1 ? false : true 
  }
}