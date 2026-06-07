import os
import re

MD_FILES = [
    "00_Front_Matter.md",
    "00_Table_of_Contents.md",
    "Chapter_1.md",
    "Chapter_2.md",
    "Chapter_3.md",
    "Chapter_4.md",
    "Chapter_5.md",
    "Chapter_6.md",
    "Chapter_7.md",
    "Chapter_8_Conclusion_References_Appendix.md"
]

LATEX_PREAMBLE = r"""\documentclass[12pt, a4paper]{report}
\usepackage{graphicx}
\usepackage{float}
\usepackage[hidelinks]{hyperref}
\usepackage{array}
\usepackage{longtable}
\usepackage{booktabs}
\usepackage{polyglossia}
\usepackage{geometry}
\geometry{a4paper, margin=1in}

\setmainlanguage[numerals=maghrib]{arabic}
\setotherlanguage{english}
\newfontfamily\arabicfont[Script=Arabic]{Arial} % You can change this to Amiri or Noto Sans Arabic on Overleaf

\begin{document}
"""

LATEX_POSTAMBLE = r"""
\end{document}
"""

def parse_markdown_to_latex(content):
    lines = content.split('\n')
    latex_lines = []
    
    in_table = False
    in_list = False
    
    for i, line in enumerate(lines):
        original_line = line
        line = line.strip()
        
        # Skip HTML comments
        if line.startswith('<!--') or line.endswith('-->'):
            continue
            
        # Handle div center
        if line == '<div align="center">':
            latex_lines.append(r'\begin{center}')
            continue
        elif line == '</div>':
            latex_lines.append(r'\end{center}')
            continue
        elif line == '<div dir="ltr">':
            latex_lines.append(r'\begin{english}')
            continue
            
        # Replace bold and italic
        line = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', line)
        line = re.sub(r'\*(.*?)\*', r'\\textit{\1}', line)
        
        # Headers
        if line.startswith('# '):
            title = line[2:].strip()
            if 'فهرس' in title or 'قائمة' in title:
                latex_lines.append(r'\chapter*{' + title + '}')
            else:
                latex_lines.append(r'\chapter*{' + title + '}')
                latex_lines.append(r'\addcontentsline{toc}{chapter}{' + title + '}')
            continue
        elif line.startswith('## '):
            latex_lines.append(r'\section*{' + line[3:].strip() + '}')
            latex_lines.append(r'\addcontentsline{toc}{section}{' + line[3:].strip() + '}')
            continue
        elif line.startswith('### '):
            latex_lines.append(r'\subsection*{' + line[4:].strip() + '}')
            latex_lines.append(r'\addcontentsline{toc}{subsection}{' + line[4:].strip() + '}')
            continue
            
        # Images
        img_match = re.match(r'!\[(.*?)\]\((.*?)\)', line)
        if img_match:
            alt_text = img_match.group(1)
            img_path = img_match.group(2)
            latex_lines.append(r'\begin{figure}[H]')
            latex_lines.append(r'\centering')
            latex_lines.append(r'\includegraphics[width=0.8\textwidth]{' + img_path + '}')
            if alt_text:
                latex_lines.append(r'\caption{' + alt_text + '}')
            latex_lines.append(r'\end{figure}')
            continue
            
        # Lists
        if line.startswith('- '):
            if not in_list:
                latex_lines.append(r'\begin{itemize}')
                in_list = True
            latex_lines.append(r'\item ' + line[2:])
            continue
        else:
            if in_list and line == '':
                latex_lines.append(r'\end{itemize}')
                in_list = False
                
        # Tables
        if line.startswith('|'):
            if not in_table:
                cols = len(line.split('|')) - 2
                latex_lines.append(r'\begin{longtable}{|' + 'c|' * cols + '}')
                latex_lines.append(r'\hline')
                in_table = True
            
            if re.match(r'^\|[\s\-\:]+\|$', line.replace('|', '')):
                continue
                
            cells = [cell.strip() for cell in line.split('|')[1:-1]]
            latex_lines.append(' & '.join(cells) + r' \\ \hline')
            continue
        else:
            if in_table and line == '':
                latex_lines.append(r'\end{longtable}')
                in_table = False

        # Page Breaks and separators
        if line == '---':
            # Check context if it's meant to be a page break (e.g. front matter)
            if i > 0 and 'PAGE BREAK' in lines[i-1]:
                latex_lines.append(r'\newpage')
            else:
                latex_lines.append(r'\vspace{0.5cm}\hrule\vspace{0.5cm}')
            continue
            
        if line == '':
            latex_lines.append('')
        else:
            # Escape some latex special chars if not already
            # (Very basic, escaping % and &)
            # line = line.replace('%', r'\%').replace('&', r'\&')
            latex_lines.append(line + r' \\')
            
    if in_list:
        latex_lines.append(r'\end{itemize}')
    if in_table:
        latex_lines.append(r'\end{longtable}')
        
    return '\n'.join(latex_lines)

with open('AynPlatformBook.tex', 'w', encoding='utf-8') as f:
    f.write(LATEX_PREAMBLE)
    
    for md_file in MD_FILES:
        if os.path.exists(md_file):
            with open(md_file, 'r', encoding='utf-8') as mf:
                latex_content = parse_markdown_to_latex(mf.read())
                f.write(latex_content)
                f.write("\n\\newpage\n")
            
    f.write(LATEX_POSTAMBLE)

print("Cleaned up LaTeX file generated.")
