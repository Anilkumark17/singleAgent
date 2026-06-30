
const jobDescriptionHandler = async(req , res) =>{
    try {
        const { jobDescription } = req.body;
        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required",
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}