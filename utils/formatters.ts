
export const toBengaliNumber = (num: number | string): string => {
  const numStr = String(num);
  const bengaliDigits: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return numStr.replace(/[0-9.]/g, (char) => bengaliDigits[char] || char);
};

export const printPdf = (url: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  
  const cleanup = () => {
    if (iframe.parentNode === document.body) {
        document.body.removeChild(iframe);
    }
  };

  iframe.onload = () => {
    try {
      if (!iframe.contentWindow) throw new Error("Iframe content not available");
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(cleanup, 2000); 
    } catch (e) {
      console.error("Could not print PDF:", e);
      window.open(url, '_blank');
      cleanup();
    }
  };

  document.body.appendChild(iframe);
};
