// returns true if error message sent so that no other interactions occur
const sendErrorMessage = async (interaction, updatedState) => {
    if (!updatedState) {
        await interaction.reply({ content: "Something went wrong, please try again later."});
        return true;
    }
    if (updatedState.error) {
        await interaction.reply({ content: updatedState.error.toString() });
        return true;
    }
    return false;
}

module.exports = { sendErrorMessage };
