import dayjs from "dayjs";

export const formatTimestamp = (timestamp: number): string => {
    return dayjs(timestamp).format('MM/DD/YYYY HH:mm')
}