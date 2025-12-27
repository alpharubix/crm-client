import { format } from 'date-fns';


export const formatExactDate = (dateString: string, formatString: string = 'dd/MM/yyyy') => {
    return format(new Date(dateString), formatString);
}