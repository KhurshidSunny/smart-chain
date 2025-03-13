import { createSlice } from '@reduxjs/toolkit';

const feedbackSlice = createSlice({
    name: 'feedback',
    initialState: {
        feedback: [],
        loading: false,
        error: null,
    },
    reducers: {
        fetchFeedbackStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchFeedbackSuccess(state, action) {
            state.feedback = action.payload;
            state.loading = false;
        },
        fetchFeedbackFailure(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { fetchFeedbackStart, fetchFeedbackSuccess, fetchFeedbackFailure } = feedbackSlice.actions;
export default feedbackSlice.reducer;