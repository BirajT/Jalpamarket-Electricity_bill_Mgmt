export const asyncHandler = (fn) => {
    return (req,res,next) => {
        return Promise.resolve(fn(req, res, next))
            .catch((error) => {next(error)})
    }
}



// const api = asyncHandler(async (req,res,next) => {
//     // logic
// })